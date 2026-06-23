#!/bin/sh
set -eu

echo "[entrypoint] Running Prisma migrations..."
pnpm prisma:deploy

echo "[entrypoint] Starting SupportFlow API..."
exec node dist/server.js
