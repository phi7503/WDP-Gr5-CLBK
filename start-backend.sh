#!/bin/bash

# Quick Start Backend Server Script
echo "🚀 Starting Backend Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to backend directory
cd BE

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in BE directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🎬 Starting Cinema Booking Backend Server..."
echo "📍 Server will be available at: http://localhost:5000"
echo "🔗 API endpoints: http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start

