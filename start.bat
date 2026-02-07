@echo off
echo.
echo ========================================
echo   SatelliteFusion Dashboard Startup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

echo Checking MongoDB connection...
mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if errorlevel 1 (
    echo WARNING: MongoDB is not running locally
    echo Please ensure MongoDB is running or configure Atlas URI in backend/.env
    echo.
)

echo.
echo Starting backend server...
echo.
start cmd /k "cd backend && npm run dev"

timeout /t 3 >nul

echo.
echo Starting frontend development server...
echo.
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Servers starting up...
echo ========================================
echo.
echo Backend will be available at:  http://localhost:5000
echo Frontend will be available at: http://localhost:5173
echo.
echo Press CTRL+C in either terminal to stop the servers.
echo.

pause
