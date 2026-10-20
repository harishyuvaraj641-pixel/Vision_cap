@echo off
title VISIONCAP Backend Server
echo ===================================================
echo   VISIONCAP -- Backend Core Engine
echo   Voice-First AI Vision Assistant
echo ===================================================
cd /d "%~dp0backend"

if not exist ".env" (
    if exist ".env.example" (
        echo [.env] Creating .env from .env.example...
        copy ".env.example" ".env" >nul
    )
)

set PY_CMD=python
py -3.11 --version >nul 2>&1
if not errorlevel 1 set PY_CMD=py -3.11

echo Starting FastAPI server at http://localhost:8080 ...
%PY_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
pause
