#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEDULE="${1:-0 3 * * *}"
CRON_CMD="${SCHEDULE} cd ${ROOT_DIR} && ${ROOT_DIR}/deploy/backup-db.sh >> ${ROOT_DIR}/backups/backup.log 2>&1"

mkdir -p "${ROOT_DIR}/backups"

TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v "deploy/backup-db.sh" > "$TMP_CRON" || true
echo "$CRON_CMD" >> "$TMP_CRON"
crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo "Backup cron installed:"
echo "$CRON_CMD"
