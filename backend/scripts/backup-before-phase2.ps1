param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\backups')
)

$ErrorActionPreference = 'Stop'
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL must be set before creating the backup.' }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $OutputDirectory "pre-phase2-$timestamp.dump"
pg_dump --dbname=$env:DATABASE_URL --format=custom --no-owner --no-acl --file=$backupPath
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed; the migration must not be applied.' }
Write-Output $backupPath
