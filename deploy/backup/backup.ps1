# Solab daily SQLite backup (PATH A — shop Windows PC).
# Copies the production DB (consistent snapshot) to a timestamped zip in
# $env:USERPROFILE\Backups\solab\ and deletes archives older than 14 days.
#
# Usage (manual):
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\backup\backup.ps1
#   Optional overrides:  -DbPath "D:\somewhere\production.db"  -KeepDays 30
#
# Schedule daily at 23:00 — run ONCE in an Administrator PowerShell:
#   $act = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\Users\jesse\Desktop\study\iset_me\solab\deploy\backup\backup.ps1`""
#   $trg = New-ScheduledTaskTrigger -Daily -At 23:00
#   Register-ScheduledTask -TaskName "Solab Backup" -Action $act -Trigger $trg -RunLevel Highest
#
# NOTE: .env (secrets) is deliberately NOT backed up — store it separately/safely.
# Copy the backup folder to an external drive regularly (same disk = no real safety).

param(
    [string]$DbPath = "",
    [int]$KeepDays = 14
)

$ErrorActionPreference = "Stop"

# Default DB path: <repo-root>\prisma\db\production.db (this script lives in deploy\backup\).
if (-not $DbPath) {
    $repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $DbPath = Join-Path $repoRoot "prisma\db\production.db"
}

if (-not (Test-Path -LiteralPath $DbPath)) {
    Write-Error "Database not found: $DbPath"
    exit 1
}

$backupDir = Join-Path $env:USERPROFILE "Backups\solab"
if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $backupDir "solab-$stamp.db.zip"

# Compress-Archive on a live SQLite file can catch it mid-write; take a
# consistent copy first, zip the copy, then delete the copy.
$tempCopy = Join-Path $env:TEMP "solab-backup-$stamp.db"
Copy-Item -LiteralPath $DbPath -Destination $tempCopy -Force
Compress-Archive -LiteralPath $tempCopy -DestinationPath $outFile -Force
Remove-Item -LiteralPath $tempCopy -Force

# Retention: delete archives older than $KeepDays.
$cutoff = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem -LiteralPath $backupDir -Filter "solab-*.db.zip" -File |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    Remove-Item -Force

$sizeKb = [math]::Round((Get-Item -LiteralPath $outFile).Length / 1KB, 1)
Write-Host "OK: $outFile ($sizeKb KB)"
