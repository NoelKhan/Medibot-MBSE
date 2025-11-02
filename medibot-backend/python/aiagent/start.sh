#!/bin/bash
# AI Agent Startup Script
# Ensures Ollama is running and starts FastAPI server

set -e

echo "🚀 Starting MediBot AI Agent..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Ollama is running
echo "Checking Ollama service..."
if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "❌ Error: Ollama is not running on localhost:11434"
    echo ""
    echo "Please start Ollama first:"
    echo "  - Docker: docker run -d -p 11434:11434 -v ollama:/root/.ollama ollama/ollama:latest"
    echo "  - Local: ollama serve"
    echo ""
    exit 1
fi
echo "✅ Ollama is running"
echo ""

# Check if model exists (via Docker or local)
echo "Checking for llama3.2 model..."
if docker ps --format '{{.Names}}' | grep -q "^ollama$"; then
    if ! docker exec ollama ollama list | grep -q "llama3.2"; then
        echo "📥 Pulling llama3.2 model..."
        docker exec ollama ollama pull llama3.2:latest
    fi
elif command -v ollama &> /dev/null; then
    if ! ollama list | grep -q "llama3.2"; then
        echo "📥 Pulling llama3.2 model..."
        ollama pull llama3.2:latest
    fi
else
    echo "⚠️  Warning: Cannot verify model (ollama command not found)"
    echo "    Assuming model is already pulled in Docker container"
fi
echo "✅ Model ready"
echo ""

# Install Python dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
fi

if [ -f "api/requirements.txt" ]; then
    pip install -q -r api/requirements.txt
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Start FastAPI server
echo ""
echo -e "${GREEN}✅ Starting FastAPI server on port 8000...${NC}"
echo "================================"
echo ""

cd api
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
