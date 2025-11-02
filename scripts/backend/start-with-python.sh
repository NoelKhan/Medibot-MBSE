#!/bin/bash

# MediBot Backend - Integrated Startup Script
# This script starts both NestJS backend and Python AIAgent

echo "🚀 Starting MediBot Backend with integrated Python AIAgent..."
echo ""

# Check if Python is available
if ! command -v python3.9 &> /dev/null; then
    echo "❌ Python 3.9 not found. Please install Python 3.9"
    exit 1
fi

# Check if requirements are installed
if [ ! -d "python/aiagent/venv" ]; then
    echo "📦 Setting up Python virtual environment..."
    cd python/aiagent
    python3.9 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
fi

echo "✅ Python environment ready"
echo ""

# Start NestJS backend (which will auto-start Python AIAgent)
echo "🟢 Starting NestJS backend (includes Python AIAgent)..."
npm run start:dev

