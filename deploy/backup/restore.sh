#!/usr/bin/env bash
# Solab SQLite restore (PATH B — Ubuntu VPS).
#
# STOP THE APP FIRST:  sudo systemctl stop solab
# Restoring over a running SQLite file corrupts data.
#
# Usage:
#   CONFIRM=prod /opt/solab/deploy/backup/restore.sh /opt/solab/backups/solab-YYYYMMDD-HHMMSS.db.gz
# or bypass the confirmation with --force as the first argument.
#
# The script refuses to run unless CONFIRM=prod is set (or --force given),
# to make "oops, ran it in the wrong shell" impossible.

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/solab}"
DB_FILE="${DB_FILE:-$APP_DIR/prisma/db/production.db}"

ARCHIVE="${1:-}"
FORCE=0
if [ "${1:-}" = "--force" ]; then
  FORCE=1
  ARCHIVE="${2:-}"
fi

if [ -z "$ARCHIVE" ]; then
  echo "Usage: $0 [--force] /path/to/solab-YYYYMMDD-HHMMSS.db.gz" >&2
  exit 1
fi
[ -f "$ARCHIVE" ] || { echo "ERROR: archive not found: $ARCHIVE" >&2; exit 1; }

if [ "$FORCE" -ne 1 ] && [ "${CONFIRM:-}" != "prod" ]; then
  echo "REFUSING to run: this OVERWRITES the production database ($DB_FILE)." >&2
  echo "Stop the app, then re-run with:  CONFIRM=prod $0 $ARCHIVE" >&2
  exit 1
fi

echo "WARNING: overwriting $DB_FILE with $ARCHIVE"
if [ "$FORCE" -ne 1 ]; then
  echo "Make sure the app is STOPPED (sudo systemctl stop solab)."
  sleep 3
fi

# Decompress to a temp file in the same directory, then move atomically.
TMP="$(mktemp "$APP_DIR/prisma/db/.restore-XXXXXX")"
gunzip -c "$ARCHIVE" > "$TMP"
mv -f "$TMP" "$DB_FILE"
chown solab:solab "$DB_FILE" 2>/dev/null || true

echo "OK: database restored from $ARCHIVE"
echo "Start the app again:  sudo systemctl start solab"
