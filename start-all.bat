@echo off
setlocal
set ROOT=%~dp0

echo ============================================================
echo  TechStore Kafka Platform
echo ============================================================
echo.

echo Killing any leftover Node.js processes from previous runs...
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
echo Done.
echo.

echo Starting Control Panel API server (port 4174)...
start "Control Panel API" cmd /k "title Control Panel API :4174 && cd /d "%ROOT%control-panel" && node server.cjs"

echo Waiting for API server to start...
timeout /t 3 /nobreak >nul

echo Starting Control Panel UI (port 9000)...
start "Control Panel UI  :4173" cmd /k "title Control Panel UI :4173 && cd /d "%ROOT%control-panel" && npm run dev"

echo.
timeout /t 4 /nobreak >nul

echo Opening Control Panel in browser...
start "" "http://localhost:4173"

echo.
echo ============================================================
echo  Control Panel is starting at http://localhost:4173
echo.
echo  From there you can start / stop all services individually
echo  or use the "Start All" button to launch everything.
echo.
echo  Key URLs once services are running:
echo   Store UI            http://localhost:5174
echo   Kafka Training UI   http://localhost:5173
echo   Kafka UI            http://localhost:8080
echo   Keycloak Admin      http://localhost:8180/admin
echo.
echo  Default Keycloak admin login:
echo   Username: admin
echo   Password: admin
echo   Realm admin: admin@mrhdigital.co.za / admin123
echo ============================================================
echo.
pause
