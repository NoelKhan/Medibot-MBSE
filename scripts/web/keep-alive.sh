#!/bin/bash
# MediBot Web - Keep Alive Script
# Ensures the dev server stays running

cd "$(dirname "$0")"

echo "🔄 Starting MediBot Web Dev Server Monitor..."
echo "📍 Location: $(pwd)"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "bun.*vite" 2>/dev/null
sleep 2

# Start the dev server
echo "🚀 Starting dev server with Bun..."
bun --bun vite --host 0.0.0.0 &
SERVER_PID=$!

echo "✅ Dev server started (PID: $SERVER_PID)"
echo "🌐 Access at: http://localhost:5173/"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Monitor the process
while true; do
  if ! ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "❌ Server crashed! Restarting in 3 seconds..."
    sleep 3
    bun --bun vite --host 0.0.0.0 &
    SERVER_PID=$!
    echo "✅ Server restarted (PID: $SERVER_PID)"
  fi
  sleep 5
done
