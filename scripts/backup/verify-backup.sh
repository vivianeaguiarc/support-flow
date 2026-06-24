#!/usr/bin/env bash
# Verify the integrity of a PostgreSQL backup file.
# Checks: file exists, is not empty, and is readable as a valid dump.
#
# Usage:
#   ./scripts/backup/verify-backup.sh <backup-file>
#   pnpm db:backup:verify -- backups/supportflow_supportflow_20260624_180000Z.dump

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/backup/_lib.sh
. "$SCRIPT_DIR/_lib.sh"

FILE="${1:-}"
[ -n "$FILE" ] || die "Usage: verify-backup.sh <backup-file>"
[ -f "$FILE" ] || die "Backup file not found: $FILE"
[ -s "$FILE" ] || die "Backup file is empty: $FILE"

log "Verifying backup: $FILE"

case "$FILE" in
  *.dump)
    require_command pg_restore
    # --list reads the archive table of contents; fails if the file is corrupt.
    if pg_restore --list "$FILE" >/dev/null 2>&1; then
      ENTRIES="$(pg_restore --list "$FILE" 2>/dev/null | grep -cvE '^;|^[[:space:]]*$' || true)"
      log "Valid custom-format dump. Archive has ${ENTRIES} catalog entries."
    else
      die "Verification failed: pg_restore could not read the archive (corrupt dump)."
    fi
    ;;
  *.gz)
    require_command gzip
    gzip -t "$FILE" 2>/dev/null || die "Verification failed: corrupt gzip archive."
    gzip -dc "$FILE" 2>/dev/null | head -c 1 >/dev/null ||
      die "Verification failed: could not read decompressed contents."
    log "Valid gzip-compressed SQL dump."
    ;;
  *.sql)
    head -c 1 "$FILE" >/dev/null || die "Verification failed: could not read SQL file."
    log "Plain SQL dump is readable."
    ;;
  *)
    die "Unsupported backup extension. Expected .dump, .gz or .sql"
    ;;
esac

log "Backup verification passed."
