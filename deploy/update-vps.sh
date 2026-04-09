#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-Evgeniy_back-end}"

cd "$ROOT_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml build
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml up -d

echo "Update completed for branch: $BRANCH"
