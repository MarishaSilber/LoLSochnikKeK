#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /absolute/or/relative/path/to/backup.dump" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
COMPOSE_ARGS=(--env-file "$ROOT_DIR/deploy/vps.env" -f "$ROOT_DIR/docker-compose.prod.yml")
CONTAINER_FILE="/tmp/vuzhub-restore.dump"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

CONTAINER_ID="$(docker compose "${COMPOSE_ARGS[@]}" ps -q db)"
if [[ -z "$CONTAINER_ID" ]]; then
  echo "Database container is not running." >&2
  exit 1
fi

docker cp "$BACKUP_FILE" "${CONTAINER_ID}:${CONTAINER_FILE}"
docker compose "${COMPOSE_ARGS[@]}" exec -T db sh -lc "pg_restore -U vuzhub_user -d vuzhub_db --clean --if-exists ${CONTAINER_FILE}"
docker compose "${COMPOSE_ARGS[@]}" exec -T db sh -lc "rm -f ${CONTAINER_FILE}"

echo "Restore completed from: ${BACKUP_FILE}"
