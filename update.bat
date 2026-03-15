@echo off
cd /d "%~dp0"
echo Pulling latest changes...
git pull
if %errorlevel% neq 0 (
    echo git pull failed.
    pause
    exit /b 1
)