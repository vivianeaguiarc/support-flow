#!/usr/bin/env bash
# Restore a PostgreSQL backup created by backup-postgres.sh.
# DESTRUCTIVE: overwrites objects in the target database. Requires confirmation.
#
# Usage:
#   ./scripts/backup/restore-postgres.sh <backup-file> [--force]
#   pnpm db:restore -- backups/supportflow_supportflow_20260624_180000Z.dump
#
# Target database: RESTORE_DATABASE_URL, else BACKUP_DATABASE_URL, else DATABASE_URL.
# Non-interactive automation: pass --force or set FORCE_RESTORE=true.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# shellcheck source=scripts/backup/_lib.sh
. "$SCRIPT_DIR/_lib.sh"

FILE="${1:-}"
[ -n "$FILE" ] || die "Usage: restore-postgres.sh <backup-file> [--force]"
[ -f "$FILE" ] || die "Backup file not found: $FILE"
[ -s "$FILE" ] || die "Backup file is empty: $FILE"

FORCE="false"
[ "${2:-}" = "--force" ] && FORCE="true"
[ "${FORCE_RESTORE:-}" = "true" ] && FORCE="true"

require_command pg_restore

# Always validate the backup before touching the target database.
"$SCRIPT_DIR/verify-backup.sh" "$FILE"

TARGET_URL="${RESTORE_DATABASE_URL:-$(resolve_database_url "$ROOT_DIR")}"
[ -n "$TARGET_URL" ] ||
  die "No target database URL. Set RESTORE_DATABASE_URL, BACKUP_DATABASE_URL or DATABASE_URL."
CONN="$(sanitize_pg_url "$TARGET_URL")"

DB_LABEL="$(db_name_from_url "$CONN")"
DB_LABEL="${DB_LABEL:-database}"
HOST_LABEL="$(host_from_url "$CONN")"

echo ""
log "About to RESTORE backup into:"
log "  database: $DB_LABEL"
log "  host:     $HOST_LABEL"
log "  file:     $FILE"
log "This will DROP and recreate existing objects (--clean --if-exists)."
echo ""

if [ "$FORCE" != "true" ]; then
  if [ ! -t 0 ]; then
    die "Refusing to restore without confirmation in a non-interactive shell. Use --force to override."
  fi
  printf 'Type the database name "%s" to confirm the restore: ' "$DB_LABEL"
  read -r answer
  [ "$answer" = "$DB_LABEL" ] || die "Confirmation did not match. Aborting restore."
fi

log "Restoring into '$DB_LABEL'..."
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$CONN" \
  "$FILE"

log "Restore completed successfully into '$DB_LABEL'."
