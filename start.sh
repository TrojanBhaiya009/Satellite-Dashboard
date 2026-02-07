#!/bin/bash

echo ""
echo "========================================"
echo "  SatelliteFusion Dashboard Startup"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Download from: https://nodejs.org"
    exit 1
fi

# Check MongoDB (optional)
if ! command -v mongosh &> /dev/null; then
    echo "WARNING: MongoDB CLI not found"
    echo "Make sure MongoDB server is running or use Atlas URI in backend/.env"
    echo ""
fi

echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

sleep 3

echo ""
echo "Starting frontend development server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Servers starting up..."
echo "========================================"
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press CTRL+C to stop all servers"
echo ""

wait
