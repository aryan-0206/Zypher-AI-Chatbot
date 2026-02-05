@echo off
title Zypher AI - Startup
echo ==========================================
echo           🚀 Launching Zypher AI
echo ==========================================
echo.

echo [1/2] Starting Backend Server...
cd backend
if not exist "venv" (
    echo Error: Virtual environment (venv) not found.
    echo Please run 'python -m venv venv' inside backend folder first.
    pause
    exit /b
)

:: Run the backend which is already programmed to start the frontend automatically
start /min "Zypher AI Backend" cmd /k "venv\Scripts\activate && python app.py"

echo.
echo [2/2] Launching Frontend & Browser...
echo Wait a few seconds for the application to initialize...
echo.
echo ==========================================
echo  Zypher AI will open at: http://localhost:3000
echo ==========================================
echo.
echo Close the terminal windows to stop the servers.
echo.
pause
