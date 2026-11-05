# deploy.ps1: pull, build and switch tjabo.dev with no downtime on failure (Windows).
#
#   powershell -ExecutionPolicy Bypass -File C:\tjabo.dev\deploy.ps1            # normal deploy
#   powershell -ExecutionPolicy Bypass -File C:\tjabo.dev\deploy.ps1 -SetupTask # (re)create the boot task first
#   ... -NoPull      deploy what's checked out, don't git pull
#   ... -Rollback    switch back to the previous release
#
# Layout (everything under the checkout, all ignored by git):
#   releases\<time>-<sha>\   one self-contained build per deploy (git archive + npm ci + next build)
#   current\                 junction to the live release; start-tjabo.dev.cmd runs `npm start` in it
#   cache\                   GitHub data cache shared by all releases (CACHE_DIR)
#   logs\tjabo.dev.log       server output
#   .env                     secrets, copied into each release
#
# A release only goes live after npm ci, the tests and next build all pass. After the switch the
# site must answer /api/health with the new BUILD_ID within 90 s, otherwise the old release comes back.

param(
    [switch]$SetupTask,
    [switch]$NoPull,
    [switch]$Rollback,
    [int]$Keep = 3
)

$ErrorActionPreference = 'Stop'
$TaskName = 'tjabo.dev'
$Port     = 8000
$Root     = $PSScriptRoot
$Releases = Join-Path $Root 'releases'
$Current  = Join-Path $Root 'current'
$Logs     = Join-Path $Root 'logs'
$Health   = "http://127.0.0.1:$Port/api/health"

Set-Location $Root
New-Item -ItemType Directory -Force -Path $Releases, $Logs, (Join-Path $Root 'cache') | Out-Null

function Say($msg, $color = 'Cyan') { Write-Host "[deploy] $msg" -ForegroundColor $color }

function Run($exe, [string[]]$cmdArgs, $where = $Root) {
    Say "$exe $($cmdArgs -join ' ')"
    Push-Location $where
    try {
        & $exe @cmdArgs
        if ($LASTEXITCODE -ne 0) { throw "'$exe $($cmdArgs -join ' ')' failed (exit $LASTEXITCODE)" }
    } finally { Pop-Location }
}

function Get-Live {
    if (-not (Test-Path $Current)) { return $null }
    $item = Get-Item $Current -Force
    if ($item.LinkType -eq 'Junction') { return [string]($item.Target | Select-Object -First 1) }
    return $null
}

function Set-Live($dir) {
    if (Test-Path $Current) { cmd /c rmdir "$Current" | Out-Null }  # removes the junction, never the target
    cmd /c mklink /J "$Current" "$dir" | Out-Null
    if ((Get-Live) -ne $dir) { throw "could not point current\ at $dir" }
}

function Stop-Site {
    Say 'stopping site' Yellow
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    }
    # Ending the task can leave node running: free the port too.
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($procId in ($conns.OwningProcess | Sort-Object -Unique)) {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

function Start-Site {
    Say 'starting site' Yellow
    Start-ScheduledTask -TaskName $TaskName
}

function Wait-Healthy($buildId) {
    for ($i = 0; $i -lt 90; $i++) {
        try {
            $h = Invoke-RestMethod -Uri $Health -TimeoutSec 3
            if ($h.ok -and (-not $buildId -or $h.build -eq $buildId)) {
                $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 20
                if ($resp.StatusCode -eq 200) { return $true }
            }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Register-SiteTask {
    Say "registering scheduled task \$TaskName (at startup, as $env:USERNAME, no stored password)" Yellow
    $start    = Join-Path $Root 'start-tjabo.dev.cmd'
    $action   = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$start`"" -WorkingDirectory $Root
    $trigger  = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) `
                -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
                -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal `
        -Settings $settings -Description 'tjabo.dev (starts at boot; deploy.ps1 restarts it)' -Force | Out-Null
}

function Rotate-Log {
    $log = Join-Path $Logs 'tjabo.dev.log'
    if ((Test-Path $log) -and (Get-Item $log).Length -gt 10MB) {
        Move-Item $log "$log.1" -Force
    }
}

# ---------- rollback ----------
if ($Rollback) {
    $live = Get-Live
    $prev = Get-ChildItem $Releases -Directory | Sort-Object Name -Descending | Where-Object { $_.FullName -ne $live } | Select-Object -First 1
    if (-not $prev) { throw 'no previous release to roll back to' }
    Stop-Site
    Set-Live $prev.FullName
    Start-Site
    if (Wait-Healthy $null) { Say "rolled back to $($prev.Name)" Green; exit 0 }
    Say 'rolled back, but the site is not answering: check logs\tjabo.dev.log' Red; exit 1
}

if ($SetupTask) { Register-SiteTask }
if (-not (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue)) {
    throw "scheduled task \$TaskName is missing: run deploy.ps1 -SetupTask"
}

# ---------- pull (and re-run if this script changed) ----------
if (-not $NoPull) {
    $before = (Get-FileHash $PSCommandPath).Hash
    Run 'git' @('pull', '--ff-only')
    if ((Get-FileHash $PSCommandPath).Hash -ne $before) {
        Say 'deploy.ps1 changed in this pull, running the new version'
        & powershell -ExecutionPolicy Bypass -File $PSCommandPath -NoPull -Keep $Keep
        exit $LASTEXITCODE
    }
}

if (-not (Test-Path (Join-Path $Root '.env'))) { Say 'no .env: the contact form and GitHub token will be missing' Red }

# ---------- build into a fresh folder ----------
$sha  = (git rev-parse --short HEAD).Trim()
$name = "$(Get-Date -Format 'yyyyMMdd-HHmmss')-$sha"
$dir  = Join-Path $Releases $name
New-Item -ItemType Directory -Path $dir | Out-Null
$tar = Join-Path $Releases "$name.tar"
try {
    Run 'git' @('archive', '--format=tar', '-o', $tar, 'HEAD')
    Run 'tar' @('-xf', $tar, '-C', $dir)
    Remove-Item $tar -Force
    if (Test-Path (Join-Path $Root '.env')) { Copy-Item (Join-Path $Root '.env') (Join-Path $dir '.env') }
    $env:CACHE_DIR = Join-Path $Root 'cache'
    $env:NEXT_TELEMETRY_DISABLED = '1'
    Run 'npm.cmd' @('ci', '--no-audit', '--no-fund') $dir
    Run 'npm.cmd' @('test') $dir
    Run 'npm.cmd' @('run', 'build') $dir
} catch {
    Say "build failed, the live site was not touched: $_" Red
    Remove-Item $tar -Force -ErrorAction SilentlyContinue
    Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}
$buildId = (Get-Content (Join-Path $dir '.next\BUILD_ID') -Raw).Trim()
Say "built $name (BUILD_ID $buildId)" Green

# ---------- switch ----------
$prev = Get-Live
Stop-Site
Rotate-Log
Set-Live $dir
Start-Site
if (Wait-Healthy $buildId) {
    Say "live: $name on port $Port" Green
} else {
    Say 'new build did not come up healthy, rolling back' Red
    Stop-Site
    if ($prev -and (Test-Path $prev)) { Set-Live $prev }
    Start-Site
    if (Wait-Healthy $null) { Say "back on $(Split-Path $prev -Leaf)" Yellow } else { Say 'old release is not answering either: check logs\tjabo.dev.log' Red }
    exit 1
}

# ---------- prune old releases (keep the newest $Keep, never the live one) ----------
$live = Get-Live
Get-ChildItem $Releases -Directory | Sort-Object Name -Descending | Select-Object -Skip $Keep |
    Where-Object { $_.FullName -ne $live } |
    ForEach-Object { Say "pruning $($_.Name)"; Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
exit 0
