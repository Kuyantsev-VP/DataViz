@echo off
cd /d "%~dp0app"
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed.
    pause
    exit /b 1
)
echo Building desktop app...
call npm run electron:build
if %errorlevel% neq 0 (
    echo Build failed.
    pause
    exit /b 1
)
echo.
echo Build complete! Output is in dist-electron/
pause
