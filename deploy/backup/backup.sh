#!/usr/bin/env bash
# Solab daily SQLite backup (PATH B — Ubuntu VPS).
# Uses sqlite3's online .backup (consistent copy even while the app runs),
# then gzips into BACKUP_DIR and prunes archives older than RETAIN_DAYS.
#
# Config via environment variables (all optional):
#   APP_DIR     app root                     (default /opt/solab)
#   BACKUP_DIR  where archives are written   (default $APP_DIR/backups)
#   RETAIN_DAYS keep archives this many days (default 14)
#
# Schedule daily at 23:00 as the solab user:  crontab -e -u solab
#   0 23 * * * /opt/solab/deploy/backup/backup.sh >> /opt/solab/backups/backup.log 2>&1
#
# NOTE: .env (secrets) is deliberately NOT backed up — store it separately/safely.

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/solab}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

# DATABASE_URL lives in .env; the production db file is prisma/db/production.db.
DB_FILE="${DB_FILE:-$APP_DIR/prisma/db/production.db}"

[ -f "$DB_FILE" ] || { echo "ERROR: database not found: $DB_FILE" >&2; exit 1; }
command -v sqlite3 >/dev/null || { echo "ERROR: sqlite3 not installed (sudo apt-get install -y sqlite3)" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TMP="$BACKUP_DIR/.solab-$STAMP.tmp"
OUT="$BACKUP_DIR/solab-$STAMP.db.gz"

# Safe online backup to a temp file, then compress atomically.
sqlite3 "$DB_FILE" ".backup '$TMP'"
gzip -c "$TMP" > "$OUT"
rm -f "$TMP"

# Prune archives older than RETAIN_DAYS.
find "$BACKUP_DIR" -name 'solab-*.db.gz' -type f -mtime "+$RETAIN_DAYS" -delete

SIZE="$(du -h "$OUT" | cut -f1)"
echo "OK: $OUT ($SIZE)"
