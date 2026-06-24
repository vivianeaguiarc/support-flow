#!/usr/bin/env bash
# Create a compressed, timestamped PostgreSQL backup using pg_dump (custom format).
#
# Usage:
#   BACKUP_ENABLED=true ./scripts/backup/backup-postgres.sh
#   pnpm db:backup
#
# Configuration (env vars or .env): BACKUP_ENABLED, BACKUP_DATABASE_URL (falls
# back to DATABASE_URL), BACKUP_OUTPUT_DIR, BACKUP_RETENTION_DAYS.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# shellcheck source=scripts/backup/_lib.sh
. "$SCRIPT_DIR/_lib.sh"

require_command pg_dump

BACKUP_ENABLED="$(resolve_config "${BACKUP_ENABLED:-}" BACKUP_ENABLED "$ROOT_DIR" false)"
if [ "$BACKUP_ENABLED" != "true" ]; then
  die "Backups are disabled. Set BACKUP_ENABLED=true (env or .env) to allow this script to run."
fi

DATABASE_URL_RESOLVED="$(resolve_database_url "$ROOT_DIR")"
[ -n "$DATABASE_URL_RESOLVED" ] ||
  die "No database URL found. Set BACKUP_DATABASE_URL or DATABASE_URL."
CONN="$(sanitize_pg_url "$DATABASE_URL_RESOLVED")"

OUTPUT_DIR="$(resolve_config "${BACKUP_OUTPUT_DIR:-}" BACKUP_OUTPUT_DIR "$ROOT_DIR" "$ROOT_DIR/backups")"
RETENTION_DAYS="$(resolve_config "${BACKUP_RETENTION_DAYS:-}" BACKUP_RETENTION_DAYS "$ROOT_DIR" 7)"

mkdir -p "$OUTPUT_DIR"

DB_NAME="$(db_name_from_url "$CONN")"
DB_LABEL="${DB_NAME:-database}"
HOST_LABEL="$(host_from_url "$CONN")"
TIMESTAMP="$(date -u +%Y%m%d_%H%M%SZ)"
OUTFILE="$OUTPUT_DIR/supportflow_${DB_LABEL}_${TIMESTAMP}.dump"

log "Starting backup of '$DB_LABEL' at '$HOST_LABEL'"
log "Output file: $OUTFILE"

# Custom format (-Fc) is internally compressed and restorable with pg_restore.
if ! pg_dump \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="$OUTFILE" \
  "$CONN"; then
  rm -f "$OUTFILE"
  die "pg_dump failed; partial backup file removed."
fi

SIZE="$(du -h "$OUTFILE" | cut -f1)"
log "Backup completed: $OUTFILE ($SIZE)"

# Retention policy: prune dumps older than BACKUP_RETENTION_DAYS days.
if printf '%s' "$RETENTION_DAYS" | grep -qE '^[0-9]+$' && [ "$RETENTION_DAYS" -gt 0 ]; then
  log "Applying retention: removing supportflow_*.dump older than ${RETENTION_DAYS} day(s) in $OUTPUT_DIR"
  find "$OUTPUT_DIR" -maxdepth 1 -type f -name 'supportflow_*.dump' \
    -mtime "+$RETENTION_DAYS" -print -delete || true
fi

# Self-verify the freshly created backup.
"$SCRIPT_DIR/verify-backup.sh" "$OUTFILE"

log "Backup and verification finished successfully."
