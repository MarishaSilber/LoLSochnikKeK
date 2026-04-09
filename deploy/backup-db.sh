#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-$ROOT_DIR/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
COMPOSE_ARGS=(--env-file "$ROOT_DIR/deploy/vps.env" -f "$ROOT_DIR/docker-compose.prod.yml")
CONTAINER_FILE="/tmp/vuzhub-${TIMESTAMP}.dump"
HOST_FILE="${OUTPUT_DIR}/vuzhub-${TIMESTAMP}.dump"

mkdir -p "$OUTPUT_DIR"

if ! docker compose "${COMPOSE_ARGS[@]}" ps -q db >/dev/null 2>&1; then
  echo "Database container is not available." >&2
  exit 1
fi

docker compose "${COMPOSE_ARGS[@]}" exec -T db sh -lc "pg_dump -U vuzhub_user -d vuzhub_db -Fc -f ${CONTAINER_FILE}"
CONTAINER_ID="$(docker compose "${COMPOSE_ARGS[@]}" ps -q db)"
docker cp "${CONTAINER_ID}:${CONTAINER_FILE}" "${HOST_FILE}"
docker compose "${COMPOSE_ARGS[@]}" exec -T db sh -lc "rm -f ${CONTAINER_FILE}"

echo "Backup created: ${HOST_FILE}"
