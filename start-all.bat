@echo off
REM Start API server
start "API" cmd /k "cd /d %~dp0api && node index.js"
REM Start Frontend
start "Frontend" cmd /k "cd /d %~dp0frontend && npm start"
