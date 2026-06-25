/**
 * Contract diff: detects breaking changes between the committed baseline
 * (docs/openapi.baseline.json) and the current spec (docs/openapi.json).
 *
 * Breaking changes detected:
 *  - removed endpoint / operation;
 *  - removed required field in a response;
 *  - new required field/parameter in a request;
 *  - type change in request/response schemas;
 *  - removed/changed documented status code;
 *  - incompatible parameter changes (optional -> required, type change).
 *
 * Compatible additions (new endpoints, new optional fields, new status codes)
 * are reported as informational and never fail the check.
 *
 * Exit code is 1 when any breaking change is found. Run with `pnpm openapi:diff`.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import SwaggerParser from '@apidevtools/swagger-parser';

type Json = Record<string, unknown>;
type Direction = 'request' | 'response';

interface Change {
  kind: 'breaking' | 'compatible';
  message: string;
}

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'patch',
  'options',
  'head',
] as const;

const MAX_DEPTH = 25;

function asObject(value: unknown): Json | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Json)
    : undefined;
}

function jsonSchemaOf(container: unknown): unknown {
  const content = asObject(asObject(container)?.content);
  const media = asObject(content?.['application/json']);
  return media?.schema;
}

interface NormalizedSchema {
  type?: string;
  properties: Json;
  required: Set<string>;
  items?: unknown;
}

/** Merges `allOf` and inline properties into a single comparable shape. */
function normalize(schema: unknown, depth: number): NormalizedSchema {
  const result: NormalizedSchema = { properties: {}, required: new Set() };
  const obj = asObject(schema);
  if (!obj || depth <= 0) return result;

  const allOf = obj.allOf;
  if (Array.isArray(allOf)) {
    for (const sub of allOf) {
      const nested = normalize(sub, depth - 1);
      if (nested.type) result.type = nested.type;
      Object.assign(result.properties, nested.properties);
      nested.required.forEach((name) => result.required.add(name));
      if (nested.items) result.items = nested.items;
    }
  }

  if (typeof obj.type === 'string') result.type = obj.type;

  const properties = asObject(obj.properties);
  if (properties) {
    for (const [key, value] of Object.entries(properties)) {
      result.properties[key] = value;
    }
  }

  if (Array.isArray(obj.required)) {
    for (const name of obj.required) {
      if (typeof name === 'string') result.required.add(name);
    }
  }

  if (obj.items) result.items = obj.items;

  return result;
}

function compareSchema(
  base: unknown,
  current: unknown,
  location: string,
  direction: Direction,
  changes: Change[],
  depth: number,
): void {
  if (depth <= 0) return;

  const baseShape = normalize(base, MAX_DEPTH);
  const currentShape = normalize(current, MAX_DEPTH);

  if (
    baseShape.type &&
    currentShape.type &&
    baseShape.type !== currentShape.type
  ) {
    changes.push({
      kind: 'breaking',
      message: `${location}: tipo alterado de "${baseShape.type}" para "${currentShape.type}"`,
    });
  }

  for (const [name, baseProp] of Object.entries(baseShape.properties)) {
    const currentProp = currentShape.properties[name];
    const wasRequired = baseShape.required.has(name);

    if (currentProp === undefined) {
      if (direction === 'response' && wasRequired) {
        changes.push({
          kind: 'breaking',
          message: `${location}.${name}: campo obrigatório removido da resposta`,
        });
      } else {
        changes.push({
          kind: 'compatible',
          message: `${location}.${name}: campo removido (compatível)`,
        });
      }
      continue;
    }

    compareSchema(
      baseProp,
      currentProp,
      `${location}.${name}`,
      direction,
      changes,
      depth - 1,
    );
  }

  for (const name of currentShape.required) {
    const isNew = currentShape.properties[name] !== undefined;
    const becameRequired = !baseShape.required.has(name);
    if (direction === 'request' && becameRequired && isNew) {
      const existedOptional =
        baseShape.properties[name] !== undefined &&
        !baseShape.required.has(name);
      changes.push({
        kind: 'breaking',
        message: existedOptional
          ? `${location}.${name}: campo opcional tornou-se obrigatório na requisição`
          : `${location}.${name}: novo campo obrigatório exigido na requisição`,
      });
    }
  }

  if (baseShape.items && currentShape.items) {
    compareSchema(
      baseShape.items,
      currentShape.items,
      `${location}[]`,
      direction,
      changes,
      depth - 1,
    );
  }
}

function compareParameters(
  baseOp: Json,
  currentOp: Json,
  label: string,
  changes: Change[],
): void {
  const toMap = (op: Json): Map<string, Json> => {
    const map = new Map<string, Json>();
    const params = Array.isArray(op.parameters) ? op.parameters : [];
    for (const param of params) {
      const obj = asObject(param);
      if (obj && typeof obj.name === 'string' && typeof obj.in === 'string') {
        map.set(`${obj.in}:${obj.name}`, obj);
      }
    }
    return map;
  };

  const baseParams = toMap(baseOp);
  const currentParams = toMap(currentOp);

  for (const [key, baseParam] of baseParams) {
    const currentParam = currentParams.get(key);
    if (!currentParam) {
      changes.push({
        kind: 'compatible',
        message: `${label}: parâmetro "${key}" removido (compatível)`,
      });
      continue;
    }

    if (baseParam.required !== true && currentParam.required === true) {
      changes.push({
        kind: 'breaking',
        message: `${label}: parâmetro "${key}" tornou-se obrigatório`,
      });
    }

    compareSchema(
      baseParam.schema,
      currentParam.schema,
      `${label} param[${key}]`,
      'request',
      changes,
      MAX_DEPTH,
    );
  }

  for (const [key, currentParam] of currentParams) {
    if (!baseParams.has(key) && currentParam.required === true) {
      changes.push({
        kind: 'breaking',
        message: `${label}: novo parâmetro obrigatório "${key}"`,
      });
    }
  }
}

function compareOperation(
  baseOp: Json,
  currentOp: Json,
  label: string,
  changes: Change[],
): void {
  compareParameters(baseOp, currentOp, label, changes);

  const baseBody = asObject(baseOp.requestBody);
  const currentBody = asObject(currentOp.requestBody);
  if (currentBody?.required === true && baseBody?.required !== true) {
    changes.push({
      kind: 'breaking',
      message: `${label}: corpo da requisição tornou-se obrigatório`,
    });
  }
  if (baseBody && currentBody) {
    compareSchema(
      jsonSchemaOf(baseBody),
      jsonSchemaOf(currentBody),
      `${label} requestBody`,
      'request',
      changes,
      MAX_DEPTH,
    );
  }

  const baseResponses = asObject(baseOp.responses) ?? {};
  const currentResponses = asObject(currentOp.responses) ?? {};
  for (const [status, baseResponse] of Object.entries(baseResponses)) {
    const currentResponse = currentResponses[status];
    if (currentResponse === undefined) {
      changes.push({
        kind: 'breaking',
        message: `${label}: status ${status} removido da documentação`,
      });
      continue;
    }
    compareSchema(
      jsonSchemaOf(baseResponse),
      jsonSchemaOf(currentResponse),
      `${label} response[${status}]`,
      'response',
      changes,
      MAX_DEPTH,
    );
  }

  for (const status of Object.keys(currentResponses)) {
    if (baseResponses[status] === undefined) {
      changes.push({
        kind: 'compatible',
        message: `${label}: novo status ${status} documentado`,
      });
    }
  }
}

function compareSpecs(base: Json, current: Json): Change[] {
  const changes: Change[] = [];
  const basePaths = asObject(base.paths) ?? {};
  const currentPaths = asObject(current.paths) ?? {};

  for (const [route, basePathItem] of Object.entries(basePaths)) {
    const currentPathItem = asObject(currentPaths[route]);
    if (!currentPathItem) {
      changes.push({
        kind: 'breaking',
        message: `Endpoint removido: ${route}`,
      });
      continue;
    }

    const baseItem = asObject(basePathItem) ?? {};
    for (const method of HTTP_METHODS) {
      const baseOp = asObject(baseItem[method]);
      if (!baseOp) continue;

      const currentOp = asObject(currentPathItem[method]);
      if (!currentOp) {
        changes.push({
          kind: 'breaking',
          message: `Operação removida: ${method.toUpperCase()} ${route}`,
        });
        continue;
      }

      compareOperation(
        baseOp,
        currentOp,
        `${method.toUpperCase()} ${route}`,
        changes,
      );
    }
  }

  for (const route of Object.keys(currentPaths)) {
    if (basePaths[route] === undefined) {
      changes.push({
        kind: 'compatible',
        message: `Novo endpoint adicionado: ${route}`,
      });
    }
  }

  return changes;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '../..');
const currentPath = path.join(rootDir, 'docs', 'openapi.json');
const baselinePath = path.join(rootDir, 'docs', 'openapi.baseline.json');

if (!existsSync(baselinePath)) {
  console.warn(
    'No baseline found at docs/openapi.baseline.json — skipping contract diff.\n' +
      'Create it with: pnpm contract:baseline',
  );
  process.exit(0);
}

const base = (await SwaggerParser.dereference(baselinePath)) as unknown as Json;
const current = (await SwaggerParser.dereference(
  currentPath,
)) as unknown as Json;

const changes = compareSpecs(base, current);
const breaking = changes.filter((change) => change.kind === 'breaking');
const compatible = changes.filter((change) => change.kind === 'compatible');

if (compatible.length > 0) {
  console.log(`Compatible changes (${compatible.length}):`);
  for (const change of compatible) {
    console.log(`  + ${change.message}`);
  }
}

if (breaking.length === 0) {
  console.log('\nNo breaking changes detected against the baseline.');
  process.exit(0);
}

console.error(`\nBreaking changes detected (${breaking.length}):`);
for (const change of breaking) {
  console.error(`  ✗ ${change.message}`);
}
console.error(
  '\nIf these changes are intentional, update the baseline with:\n' +
    '  pnpm contract:baseline\n' +
    'and commit docs/openapi.baseline.json together with the change.',
);
process.exit(1);
