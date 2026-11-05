@echo off
rem tjabo.dev server loop (Windows). The scheduled task \tjabo.dev runs this at boot;
rem deploy.ps1 stops and starts that task. It serves the live release (current\, a junction
rem deploy.ps1 points at releases\<build>) on port 8000 and restarts it if node exits.
cd /d "%~dp0"
if not exist logs mkdir logs
:loop
if exist "%~dp0current\.next\BUILD_ID" (
	echo [%date% %time%] starting tjabo.dev>> "%~dp0logs\tjabo.dev.log"
	pushd "%~dp0current"
	call npm.cmd start >> "%~dp0logs\tjabo.dev.log" 2>&1
	popd
	echo [%date% %time%] tjabo.dev stopped, restarting in 5 seconds>> "%~dp0logs\tjabo.dev.log"
) else (
	echo [%date% %time%] no build in current\ yet: run deploy.ps1>> "%~dp0logs\tjabo.dev.log"
)
timeout /t 5 /nobreak > nul
goto loop
