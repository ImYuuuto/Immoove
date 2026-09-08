param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\backups')
)

$ErrorActionPreference = 'Stop'
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL must be set before creating the backup.' }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$uri = [Uri]$env:DATABASE_URL
if ($uri.Scheme -ne 'mysql') { throw 'DATABASE_URL must use the mysql:// protocol.' }
$database = $uri.AbsolutePath.TrimStart('/')
$credentials = $uri.UserInfo.Split(':', 2)
$user = [Uri]::UnescapeDataString($credentials[0])
$password = if ($credentials.Count -gt 1) { [Uri]::UnescapeDataString($credentials[1]) } else { '' }
$backupPath = Join-Path $OutputDirectory "pre-phase2-$timestamp.sql"
$env:MYSQL_PWD = $password
try {
  mysqldump --host=$($uri.Host) --port=$($uri.Port) --user=$user --single-transaction --routines --triggers --result-file=$backupPath $database
  if ($LASTEXITCODE -ne 0) { throw 'mysqldump failed; the migration must not be applied.' }
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}
Write-Output $backupPath
