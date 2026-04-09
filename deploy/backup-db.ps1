param(
    [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$containerId = docker compose ps -q db
if (-not $containerId) {
    throw "Database container is not running."
}

$containerFile = "/tmp/vuzhub-$timestamp.dump"
$hostFile = Join-Path $backupDir "vuzhub-$timestamp.dump"

docker compose exec -T db sh -lc "pg_dump -U vuzhub_user -d vuzhub_db -Fc -f $containerFile"
docker cp "${containerId}:${containerFile}" $hostFile
docker compose exec -T db sh -lc "rm -f $containerFile"

Write-Host "Backup created: $hostFile"
