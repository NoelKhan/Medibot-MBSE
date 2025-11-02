#!/bin/bash
# MediBot Web - Production Server Script
# =======================================
# Builds and serves the optimized production version

set -e

echo "🚀 MediBot Web - Starting Production Build..."

# Navigate to project directory
cd "$(dirname "$0")"

# Kill any existing servers on port 5173
echo "🔄 Cleaning up existing servers..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Build production version
echo "📦 Building production version..."
npm run build

# Start Python HTTP server (faster and lighter than Node)
echo "🌐 Starting production server on http://localhost:5173/..."
cd dist
python3 -m http.server 5173 > /tmp/medibot-web.log 2>&1 &
SERVER_PID=$!

sleep 2

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "✅ Production server started successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🏥 MediBot Web App"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📍 URL: http://localhost:5173/"
    echo "🔑 Demo Login: patient@demo.com / patient123"
    echo "⚡️ Mode: Production (Fast & Optimized)"
    echo "🛑 Stop: kill $SERVER_PID"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Open in browser
    open http://localhost:5173/
else
    echo "❌ Failed to start server"
    exit 1
fi
