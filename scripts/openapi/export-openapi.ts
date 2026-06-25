/**
 * Exports the generated OpenAPI (Swagger) specification to docs/openapi.json.
 *
 * The output is the single source of truth for the typed TypeScript SDK
 * (see `pnpm sdk:generate`). Run with: `pnpm openapi:export`.
 *
 * Safe defaults are set so the spec can be exported in CI without a real
 * database connection or secrets.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV ??= 'development';
process.env.DATABASE_URL ??=
  'postgresql://localhost:5432/supportflow?schema=public';
process.env.JWT_SECRET ??= 'openapi-export-placeholder-secret';
process.env.JWT_REFRESH_SECRET ??= 'openapi-export-placeholder-refresh-secret';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '../..');
const outputPath = path.join(rootDir, 'docs', 'openapi.json');

// Imported dynamically so the env defaults above are applied first.
const { swaggerSpec } = await import('../../src/config/swagger.js');

const spec = swaggerSpec as {
  openapi?: string;
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
};

const pathCount = Object.keys(spec.paths ?? {}).length;
const schemaCount = Object.keys(spec.components?.schemas ?? {}).length;

if (!spec.openapi) {
  console.error('OpenAPI export failed: missing "openapi" version field.');
  process.exit(1);
}

if (pathCount === 0) {
  console.error('OpenAPI export failed: the specification has no paths.');
  process.exit(1);
}

if (schemaCount === 0) {
  console.error('OpenAPI export failed: the specification has no schemas.');
  process.exit(1);
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');

console.log(
  `OpenAPI ${spec.openapi} exported to ${path.relative(rootDir, outputPath)} ` +
    `(${pathCount} paths, ${schemaCount} schemas).`,
);
