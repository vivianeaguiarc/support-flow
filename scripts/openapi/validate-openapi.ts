/**
 * Validates that docs/openapi.json is a structurally valid OpenAPI 3.0 document.
 *
 * Uses @apidevtools/swagger-parser, which checks the spec against the OpenAPI
 * schema and resolves/validates every internal $ref (catches dangling refs).
 *
 * Run with: `pnpm openapi:validate` (assumes `pnpm openapi:export` ran first).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import SwaggerParser from '@apidevtools/swagger-parser';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '../..');
const specPath = path.join(rootDir, 'docs', 'openapi.json');

try {
  const api = await SwaggerParser.validate(specPath);
  const title = api.info?.title ?? 'API';
  const version = api.info?.version ?? '?';
  const pathCount = Object.keys(api.paths ?? {}).length;

  console.log(`OpenAPI valid: ${title} v${version} (${pathCount} paths).`);
} catch (error) {
  console.error('OpenAPI validation failed:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
