@echo off
title VISIONCAP Orchestrator
cd /d "%~dp0"
echo ===================================================
echo               VISIONCAP STARTING...
echo    See the world. Ask anything. Hear the answer.
echo ===================================================
echo.
echo Initializing subsystems...
echo  - Backend:  http://localhost:8080
echo  - Frontend: http://localhost:3000
echo.

:: Ensure .env exists
if not exist "%~dp0backend\.env" (
    if exist "%~dp0backend\.env.example" (
        echo Copying .env.example to .env...
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
    )
)

set PY_CMD=python
py -3.11 --version >nul 2>&1
if not errorlevel 1 set PY_CMD=py -3.11

:: Launch Backend in dedicated window
start "VISIONCAP Backend [Port 8080]" /D "%~dp0backend" cmd /k "%PY_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload"

:: Small delay to allow backend to bind port 8080
timeout /t 2 /nobreak >nul 2>&1 || ping -n 3 127.0.0.1 >nul

:: Launch Vite Frontend in dedicated window
start "VISIONCAP UI [Port 3000]" /D "%~dp0" cmd /k "npm run dev"

echo.
echo ===================================================
echo VISIONCAP processes spawned successfully.
echo Opening http://localhost:3000 in your default browser...
echo ===================================================
timeout /t 3 /nobreak >nul 2>&1 || ping -n 4 127.0.0.1 >nul
start http://localhost:3000

