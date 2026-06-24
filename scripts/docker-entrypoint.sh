#!/bin/sh
set -eu

if [ "${NODE_ENV:-}" != "production" ]; then
  echo "[entrypoint] WARNING: NODE_ENV is not 'production' (current: ${NODE_ENV:-unset})" >&2
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is required" >&2
  exit 1
fi

if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  echo "[entrypoint] Running Prisma migrations (prisma migrate deploy)..."
  pnpm prisma:deploy
else
  echo "[entrypoint] Skipping migrations (SKIP_MIGRATIONS=true)"
fi

# Demo seed is NEVER run automatically in staging/production.
# Run manually after deploy: SEED_DEMO_ENABLED=true pnpm seed (see docs/staging.md)

echo "[entrypoint] Starting SupportFlow API on port ${PORT:-3000}..."
exec node dist/server.js
