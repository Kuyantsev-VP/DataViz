@echo off
cd /d "%~dp0app"
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed.
    pause
    exit /b 1
)
echo Done.
pause
