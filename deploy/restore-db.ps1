param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

$containerId = docker compose ps -q db
if (-not $containerId) {
    throw "Database container is not running."
}

$containerFile = "/tmp/restore.dump"

docker cp $BackupFile "${containerId}:${containerFile}"
docker compose exec -T db sh -lc "pg_restore -U vuzhub_user -d vuzhub_db --clean --if-exists $containerFile"
docker compose exec -T db sh -lc "rm -f $containerFile"

Write-Host "Restore completed from: $BackupFile"
