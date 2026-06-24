#!/usr/bin/env bash
# Shared helpers for the SupportFlow backup / restore / verify scripts.
# This file is meant to be sourced, not executed directly.

set -euo pipefail

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
err() { printf '[%s] ERROR: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die() {
  err "$*"
  exit 1
}

# Ensure a command exists on PATH or abort with a helpful message.
require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    die "Required command '$1' not found. Install the PostgreSQL client tools (postgresql-client)."
}

# Read a single variable from a .env file WITHOUT executing it (safe parsing).
# Usage: read_dotenv_var KEY /path/to/.env
read_dotenv_var() {
  local key="$1" file="${2:-}"
  [ -n "$file" ] && [ -f "$file" ] || return 0

  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$file" | tail -n1 || true)"
  [ -n "$line" ] || return 0

  local val="${line#*=}"
  # Strip optional surrounding single/double quotes.
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  printf '%s' "$val"
}

# Resolve a config value from: exported env -> .env file -> default.
# Usage: resolve_config VALUE_FROM_ENV KEY ROOT_DIR DEFAULT
resolve_config() {
  local current="$1" key="$2" root="$3" default="${4:-}"
  if [ -n "$current" ]; then
    printf '%s' "$current"
    return 0
  fi
  local from_file
  from_file="$(read_dotenv_var "$key" "$root/.env")"
  if [ -n "$from_file" ]; then
    printf '%s' "$from_file"
    return 0
  fi
  printf '%s' "$default"
}

# Resolve the database connection string (BACKUP_DATABASE_URL -> DATABASE_URL).
resolve_database_url() {
  local root="$1"
  local url="${BACKUP_DATABASE_URL:-${DATABASE_URL:-}}"
  if [ -z "$url" ]; then
    url="$(read_dotenv_var BACKUP_DATABASE_URL "$root/.env")"
    [ -n "$url" ] || url="$(read_dotenv_var DATABASE_URL "$root/.env")"
  fi
  printf '%s' "$url"
}

# Remove Prisma-only query params (e.g. ?schema=public) that libpq rejects.
sanitize_pg_url() {
  local url="$1"
  url="$(printf '%s' "$url" | sed -E 's/([?&])schema=[^&]*//g')"
  # Collapse a leftover '?&' and trim any trailing '?' or '&'.
  url="$(printf '%s' "$url" | sed -E 's/\?&/?/; s/[?&]$//')"
  printf '%s' "$url"
}

# Extract the database name from a postgres connection URL.
db_name_from_url() {
  local url="$1"
  local rest="${url#*://}"
  case "$rest" in
    */*) ;;
    *) printf '%s' ""; return 0 ;;
  esac
  local path="${rest#*/}"
  path="${path%%\?*}"
  printf '%s' "$path"
}

# Extract the host from a postgres connection URL (for confirmation prompts).
host_from_url() {
  local url="$1"
  local rest="${url#*://}"
  rest="${rest#*@}"
  local hostport="${rest%%/*}"
  printf '%s' "${hostport%%:*}"
}
