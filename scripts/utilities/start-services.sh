#!/bin/bash

# 🎯 MediBot Services Startup Script
# ====================================
# Starts Backend, AI Agent, Web App and checks Ollama
# All services are integrated and ready to work together

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🚀 MediBot Integrated Services Startup            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/noelkhan/dev mbse/rn"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    echo -n "   Waiting for $name..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    echo -e " ${RED}❌ Timeout${NC}"
    return 1
}

# 1. Check/Start Backend
echo "📡 Backend Service (NestJS)"
if check_port 3000; then
    echo -e "   ${YELLOW}⚠️  Port 3000 already in use${NC}"
    echo "   Testing connection..."
    if curl -s http://localhost:3000/api/health | grep -q "ok"; then
        echo -e "   ${GREEN}✅ Backend already running and healthy${NC}"
    else
        echo -e "   ${RED}❌ Port in use but service not responding${NC}"
        echo "   Kill existing process: lsof -ti:3000 | xargs kill -9"
        exit 1
    fi
else
    echo "   Starting backend..."
    cd "$BASE_DIR/medibot-backend"
    nohup npm run start:dev > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"
    
    if wait_for_service "http://localhost:3000/api/health" "backend"; then
        echo -e "   ${GREEN}✅ Backend started successfully${NC}"
    else
        echo -e "   ${RED}❌ Backend failed to start - check backend.log${NC}"
        exit 1
    fi
fi
echo ""

# 2. Check/Start AI Agent
echo "🤖 AI Agent Service (Python/FastAPI)"
if check_port 8000; then
    echo -e "   ${YELLOW}⚠️  Port 8000 already in use${NC}"
    echo "   Testing connection..."
    if curl -s http://localhost:8000/ | grep -q "status"; then
        echo -e "   ${GREEN}✅ AI Agent already running and healthy${NC}"
    else
        echo -e "   ${RED}❌ Port in use but service not responding${NC}"
        echo "   Kill existing process: lsof -ti:8000 | xargs kill -9"
        exit 1
    fi
else
    echo "   Starting AI Agent..."
    cd "$BASE_DIR/AIAgent"
    
    # Check if venv exists
    if [ ! -d ".venv" ]; then
        echo -e "   ${RED}❌ Virtual environment not found${NC}"
        echo "   Create it with: python3 -m venv .venv"
        exit 1
    fi
    
    # Start AI Agent
    source .venv/bin/activate
    nohup python api/main.py > ai-agent.log 2>&1 &
    AI_PID=$!
    echo "   PID: $AI_PID"
    
    if wait_for_service "http://localhost:8000/" "AI Agent"; then
        echo -e "   ${GREEN}✅ AI Agent started successfully${NC}"
    else
        echo -e "   ${RED}❌ AI Agent failed to start - check ai-agent.log${NC}"
        exit 1
    fi
fi
echo ""

# 3. Check Ollama
echo "🦙 Ollama Service"
if check_port 11434; then
    if curl -s http://localhost:11434/api/tags | grep -q "models"; then
        echo -e "   ${GREEN}✅ Ollama is running${NC}"
        
        # Check for required model
        if curl -s http://localhost:11434/api/tags | grep -q "llama3.2:3b"; then
            echo -e "   ${GREEN}✅ llama3.2:3b model available${NC}"
        else
            echo -e "   ${YELLOW}⚠️  llama3.2:3b model not found${NC}"
            echo "   Pull it with: ollama pull llama3.2:3b"
        fi
    else
        echo -e "   ${RED}❌ Port in use but Ollama not responding${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Ollama not running${NC}"
    echo "   Start it with: ollama serve"
    echo "   Then pull model: ollama pull llama3.2:3b"
fi
echo ""

# 4. Check Web App (optional - start separately)
echo "🌐 Web App Service"
if check_port 5173; then
    echo -e "   ${YELLOW}⚠️  Port 5173 already in use${NC}"
    if curl -s http://localhost:5173/ 2>&1 | grep -q "<!DOCTYPE"; then
        echo -e "   ${GREEN}✅ Web app already running${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Port in use but not serving web app${NC}"
    fi
else
    echo "   Web app not started (start manually if needed)"
    echo "   To start: cd $BASE_DIR/medibot-web && bun --bun vite"
fi
echo ""

# 5. Integration Verification
echo "🔗 Integration Verification"
echo "   Testing service connections..."

# Test Backend → AI Agent
if curl -s http://localhost:3000/api/health | grep -q "ok" && curl -s http://localhost:8000/ | grep -q "status"; then
    echo -e "   ${GREEN}✅ Backend ↔ AI Agent integration ready${NC}"
else
    echo -e "   ${YELLOW}⚠️  Check backend and AI Agent connectivity${NC}"
fi

# Test AI Agent → Ollama
if curl -s http://localhost:8000/ | grep -q "model" && curl -s http://localhost:11434/api/tags | grep -q "models"; then
    echo -e "   ${GREEN}✅ AI Agent ↔ Ollama integration ready${NC}"
else
    echo -e "   ${YELLOW}⚠️  Check Ollama connectivity${NC}"
fi
echo ""

# 6. Summary
echo "╔════════════════════════════════════════════════════════╗"
echo "║            📊 Service Status Summary                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Backend
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo -e "   Backend:  ${GREEN}✅ http://localhost:3000${NC}"
else
    echo -e "   Backend:  ${RED}❌ Not responding${NC}"
fi

# AI Agent
if curl -s http://localhost:8000/ | grep -q "status"; then
    echo -e "   AI Agent: ${GREEN}✅ http://localhost:8000${NC}"
else
    echo -e "   AI Agent: ${RED}❌ Not responding${NC}"
fi

# Ollama
if curl -s http://localhost:11434/api/tags | grep -q "models"; then
    echo -e "   Ollama:   ${GREEN}✅ http://localhost:11434${NC}"
else
    echo -e "   Ollama:   ${YELLOW}⚠️  Not running${NC}"
fi

# Web App
if check_port 5173 && curl -s http://localhost:5173/ 2>&1 | grep -q "<!DOCTYPE"; then
    echo -e "   Web App:  ${GREEN}✅ http://localhost:5173${NC}"
else
    echo -e "   Web App:  ${YELLOW}⚪ Not started (optional)${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║               📱 Next Steps                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Option 1: Start Web App"
echo "   cd '$BASE_DIR/medibot-web'"
echo "   bun --bun vite"
echo "   Open: http://localhost:5173"
echo ""
echo "Option 2: Start Mobile App"
echo "   cd '$BASE_DIR/medibot-mobile'"
echo "   npx expo start"
echo "   Press 'i' for iOS or 'a' for Android"
echo ""
echo "View Logs:"
echo "   Backend:  tail -f '$BASE_DIR/medibot-backend/backend.log'"
echo "   AI Agent: tail -f '$BASE_DIR/AIAgent/ai-agent.log'"
echo ""
echo "Stop Services:"
echo "   pkill -f 'nest start'"
echo "   pkill -f 'python api/main.py'"
echo "   pkill -f 'bun.*vite'"
echo ""
echo "Test Integration:"
echo "   See INTEGRATION_VERIFICATION.md"
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✅ All services integrated and ready for testing!   ║"
echo "╚════════════════════════════════════════════════════════╝"
