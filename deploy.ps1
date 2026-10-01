# deploy.ps1 - Windows version of deploy.sh for tjabo.dev
#
# Normal use (pull, build, restart):   .\deploy.ps1
# First-time / fix the scheduled task: .\deploy.ps1 -SetupTask

param(
    [switch]$SetupTask
)

$ErrorActionPreference = 'Stop'
$TaskName = 'tjabo-dev'
$Port     = 8000
$SiteDir  = $PSScriptRoot

Set-Location $SiteDir

# Runs a command like npm/git and stops the script if it fails
function Run($exe, [string[]]$cmdArgs) {
    Write-Host "> $exe $($cmdArgs -join ' ')" -ForegroundColor Cyan
    & $exe @cmdArgs
    if ($LASTEXITCODE -ne 0) { throw "'$exe $($cmdArgs -join ' ')' failed (exit code $LASTEXITCODE)" }
}

# Stops the scheduled task AND whatever is still running the site on the port
# (ending the task alone can leave the node process running)
function Stop-Site {
    Write-Host "Stopping site..." -ForegroundColor Yellow
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $TaskName
    }
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($procId in ($conns.OwningProcess | Sort-Object -Unique)) {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# (Re)creates the scheduled task with the right settings
function Register-SiteTask {
    Write-Host "Setting up scheduled task '$TaskName'..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path (Join-Path $SiteDir 'logs') | Out-Null

    $action   = New-ScheduledTaskAction -Execute 'cmd.exe' `
                -Argument "/c cd /d `"$SiteDir`" && npm.cmd start >> logs\site.log 2>&1"
    $trigger  = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $settings = New-ScheduledTaskSettingsSet `
                -ExecutionTimeLimit ([TimeSpan]::Zero) `
                -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
                -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Settings $settings -Force | Out-Null
}

# ---- Deploy ----
Stop-Site

if ($SetupTask) { Register-SiteTask }

Run 'git'     @('pull')
Run 'npm.cmd' @('ci')
Run 'npm.cmd' @('run', 'build')

Write-Host "Starting site..." -ForegroundColor Yellow
Start-ScheduledTask -TaskName $TaskName

# Wait up to 30 seconds for the site to come up
for ($i = 0; $i -lt 30; $i++) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
        Write-Host "Done! Site is running on port $Port." -ForegroundColor Green
        exit 0
    }
    Start-Sleep -Seconds 1
}
Write-Host "Site didn't start within 30 seconds. Check logs\site.log" -ForegroundColor Red
exit 1