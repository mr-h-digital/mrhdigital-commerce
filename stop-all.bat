@echo off
echo ============================================================
echo  TechStore Kafka Platform - Stopping everything
echo ============================================================
echo.

echo Killing all Node.js processes...
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
echo Done.
echo.

echo Stopping Kafka Docker containers...
cd /d "%~dp0"
docker-compose down
echo.

echo ============================================================
echo  All stopped.
echo  Spring Boot terminal windows can be closed manually.
echo ============================================================
pause
