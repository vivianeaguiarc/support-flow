#!/bin/sh
# Run demo seed against a REMOTE staging database from your dev machine.
# Requires: pnpm install, DATABASE_URL pointing to staging Postgres.
#
# Usage:
#   DATABASE_URL="postgresql://..." ./scripts/seed-staging.sh
#   # or export DATABASE_URL first, then:
#   ./scripts/seed-staging.sh
#
# The web service NEVER runs this script automatically.

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required (staging Postgres connection string)." >&2
  exit 1
fi

export NODE_ENV=production
export SEED_DEMO_ENABLED=true

echo "[seed-staging] Running idempotent demo seed against staging database..."
exec pnpm seed
