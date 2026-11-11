<#
.SYNOPSIS
    VAMO Travel AI — Production Waitlist Database Backup Script (PowerShell / Windows)

.DESCRIPTION
    Exports all records from public.waitlist_signups in Supabase PostgreSQL via the
    authenticated REST API (using service_role key) into timestamped JSON and CSV files.

    Includes guidance for Windows Task Scheduler automation, local data security,
    and handling Supabase Free Plan 7-day inactivity pause protection.

.PARAMETER SupabaseUrl
    The Supabase project URL (e.g., https://your-project.supabase.co).
    Defaults to $env:SUPABASE_URL or $env:NEXT_PUBLIC_SUPABASE_URL.

.PARAMETER ServiceRoleKey
    The Supabase service_role secret key (never check into Git!).
    Defaults to $env:SUPABASE_SERVICE_ROLE_KEY.

.PARAMETER OutputDir
    Local destination folder for backups. Defaults to '.\backups\waitlist'.

.EXAMPLE
    .\scripts\backup-waitlist.ps1 -SupabaseUrl "https://xyz.supabase.co" -ServiceRoleKey "ey..."
#>

[CmdletBinding()]
param(
    [string]$SupabaseUrl = ($env:SUPABASE_URL ? $env:SUPABASE_URL : $env:NEXT_PUBLIC_SUPABASE_URL),
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
    [string]$OutputDir = (Join-Path $PSScriptRoot "..\backups\waitlist")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " VAMO — Waitlist Database Backup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Validate credentials
if ([string]::IsNullOrWhiteSpace($SupabaseUrl)) {
    Write-Error "Missing Supabase URL. Please provide -SupabaseUrl or set `$env:SUPABASE_URL."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
    Write-Error "Missing Service Role Key. Please provide -ServiceRoleKey or set `$env:SUPABASE_SERVICE_ROLE_KEY."
    exit 1
}

# 2. Prepare timestamped output directory
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TargetDir = [System.IO.Path]::GetFullPath($OutputDir)

if (-not (Test-Path -Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "[+] Created backup directory: $TargetDir" -ForegroundColor Green
}

$JsonFile = Join-Path $TargetDir "waitlist_signups_$Timestamp.json"
$CsvFile = Join-Path $TargetDir "waitlist_signups_$Timestamp.csv"

# 3. Fetch records using Supabase REST API (bypasses RLS with service_role key)
$Endpoint = "$($SupabaseUrl.TrimEnd('/'))/rest/v1/waitlist_signups?select=*&order=created_at.desc"
$Headers = @{
    "apikey"        = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Accept"        = "application/json"
}

Write-Host "[*] Contacting Supabase endpoint..." -ForegroundColor Yellow
try {
    $Response = Invoke-RestMethod -Uri $Endpoint -Method Get -Headers $Headers -TimeoutSec 30
}
catch {
    Write-Error "Failed to fetch waitlist data from Supabase: $_"
    exit 1
}

# 4. Save results to JSON and CSV
if ($null -eq $Response -or $Response.Count -eq 0) {
    Write-Host "[!] Waitlist table is currently empty (0 records)." -ForegroundColor Yellow
    $Records = @()
} else {
    $Records = $Response
    Write-Host "[+] Retrieved $($Records.Count) waitlist subscriber record(s)." -ForegroundColor Green
}

# Save JSON
$JsonContent = $Records | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($JsonFile, $JsonContent, [System.Text.Encoding]::UTF8)
Write-Host "[+] Saved JSON backup: $JsonFile" -ForegroundColor Green

# Save CSV
if ($Records.Count -gt 0) {
    $Records | Export-Csv -Path $CsvFile -NoTypeInformation -Encoding UTF8
    Write-Host "[+] Saved CSV export:  $CsvFile" -ForegroundColor Green
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Backup Completed Successfully at $(Get-Date)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

<#
--------------------------------------------------------------------------------
AUTOMATION & SUPABASE FREE PLAN RETENTION INSTRUCTIONS
--------------------------------------------------------------------------------

1. WINDOWS TASK SCHEDULER SETUP (Daily automated run):
   To run this script automatically every day at 02:00 AM:
   
   schtasks /create /tn "VAMO_Waitlist_Backup" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"D:\CONNECT\travel-ai\scripts\backup-waitlist.ps1\"" /sc daily /st 02:00 /ru SYSTEM

2. PREVENTING SUPABASE FREE PLAN 7-DAY PAUSE:
   Supabase Free tier projects automatically pause after 7 consecutive days of
   zero REST or Auth requests.
   
   Running this scheduled backup script (or a health-check cron) every 24 to 48 hours
   makes an active API call to the database, ensuring the project remains active,
   unpaused, and ready for landing page visitors.

3. SECURITY & RETENTION:
   - Ensure the 'backups/' directory is listed in .gitignore (never commit emails).
   - Encrypt backup folders with Windows BitLocker or EFS if stored on shared drives.
   - Retain 30 days of rolling backups and purge older snapshots to respect privacy.
--------------------------------------------------------------------------------
#>

