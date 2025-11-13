@echo off
REM Quick Start Backend Server Script for Windows

echo 🚀 Starting Backend Server...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Navigate to backend directory
cd BE

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found in BE directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the server
echo 🎬 Starting Cinema Booking Backend Server...
echo 📍 Server will be available at: http://localhost:5000
echo 🔗 API endpoints: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

