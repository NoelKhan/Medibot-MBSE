#!/bin/bash

# ============================================
# MediBot Complete Stack Startup Script
# ============================================
# Starts: Backend (3001) + AI Agent (8000) + Web (3000) + Mobile (Expo)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 MediBot MBSE Full Stack Startup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$ROOT_DIR"

# ============================================
# 1. Start Database Services (Docker)
# ============================================
echo -e "${YELLOW}�� Phase 1: Database Services${NC}\n"

if command -v docker-compose &> /dev/null || command -v docker compose &> /dev/null; then
    cd infrastructure/docker
    echo -e "${GREEN}✓${NC} Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis ollama
    cd "$ROOT_DIR"
    
    echo -e "${GREEN}✓${NC} Waiting for services..."
    sleep 10
else
    echo -e "${YELLOW}⚠${NC}  Docker not found. Ensure PostgreSQL (5432) and Redis (6379) are running."
fi

# ============================================
# 2. Start Backend API (NestJS)
# ============================================
echo -e "\n${YELLOW}🔧 Phase 2: Backend API${NC}\n"

cd medibot-backend

if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC}  Creating .env from .env.example..."
    cp .env.example .env
fi

echo -e "${GREEN}✓${NC} Running database migrations..."
npm run migration:run || echo -e "${YELLOW}⚠${NC}  Migrations already applied or failed"

echo -e "${GREEN}✓${NC} Starting Backend API on port 3001..."
npm run start:dev > /tmp/medibot-backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/medibot-backend.pid

echo -e "${GREEN}✓${NC} Waiting for backend..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health &> /dev/null; then
        echo -e "${GREEN}✓${NC} Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC} Backend failed to start. Check logs: tail -f /tmp/medibot-backend.log"
        exit 1
    fi
done

cd "$ROOT_DIR"

# ============================================
# 3. Start AI Agent (Python FastAPI)
# ============================================
echo -e "\n${YELLOW}🤖 Phase 3: AI Agent${NC}\n"

cd medibot-backend/python/aiagent

if [ ! -d "venv" ]; then
    echo -e "${GREEN}✓${NC} Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo -e "${GREEN}✓${NC} Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
pip install -q -r api/requirements.txt 2>/dev/null || true

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC}  Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || echo "No .env.example found"
fi

echo -e "${GREEN}✓${NC} Starting AI Agent on port 8000..."
cd api
python main.py > /tmp/medibot-ai-agent.log 2>&1 &
AI_AGENT_PID=$!
echo $AI_AGENT_PID > /tmp/medibot-ai-agent.pid

echo -e "${GREEN}✓${NC} Waiting for AI Agent..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo -e "${GREEN}✓${NC} AI Agent is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠${NC}  AI Agent may still be starting. Check logs: tail -f /tmp/medibot-ai-agent.log"
        break
    fi
done

cd "$ROOT_DIR"

# ============================================
# 4. Start Web App (React + Vite)
# ============================================
echo -e "\n${YELLOW}🌐 Phase 4: Web Application${NC}\n"

cd medibot-web

if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installing web dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠${NC}  Creating .env.local..."
    cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_AI_AGENT_URL=http://localhost:8000
EOF
fi

echo -e "${GREEN}✓${NC} Starting Web App on port 3000..."
npm run dev > /tmp/medibot-web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > /tmp/medibot-web.pid

echo -e "${GREEN}✓${NC} Waiting for web app..."
for i in {1..30}; do
    if curl -s http://localhost:3000 &> /dev/null || curl -s http://localhost:5173 &> /dev/null; then
        echo -e "${GREEN}✓${NC} Web app is ready!"
        break
    fi
    sleep 1
done

cd "$ROOT_DIR"

# ============================================
# 5. Mobile App Info
# ============================================
echo -e "\n${YELLOW}📱 Phase 5: Mobile App (Optional)${NC}\n"
echo -e "${BLUE}To start mobile app:${NC}"
echo -e "  cd medibot-mobile"
echo -e "  npm install"
echo -e "  npm start"
echo -e "  ${YELLOW}(Then scan QR code with Expo Go)${NC}\n"

# ============================================
# Summary
# ============================================
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ MediBot MBSE is Running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📊 Service URLs:${NC}"
echo -e "  ✅ Backend API:     http://localhost:3001"
echo -e "  ✅ API Docs:        http://localhost:3001/api/docs"
echo -e "  ✅ AI Agent:        http://localhost:8000"
echo -e "  ✅ AI Agent Docs:   http://localhost:8000/docs"
echo -e "  ✅ Web App:         http://localhost:3000"
echo -e "  🔹 PostgreSQL:      localhost:5432"
echo -e "  🔹 Redis:           localhost:6379"
echo -e "  🔹 Ollama:          localhost:11434"

echo -e "\n${BLUE}📝 Logs:${NC}"
echo -e "  Backend:         tail -f /tmp/medibot-backend.log"
echo -e "  AI Agent:        tail -f /tmp/medibot-ai-agent.log"
echo -e "  Web:             tail -f /tmp/medibot-web.log"

echo -e "\n${BLUE}🛑 Stop Services:${NC}"
echo -e "  ./scripts/development/stop-all.sh"

echo -e "\n${BLUE}🧪 Test the API:${NC}"
echo -e "  curl http://localhost:3001/health"
echo -e "  curl http://localhost:8000/health"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Press Ctrl+C to stop all services...${NC}\n"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    
    [ -f /tmp/medibot-backend.pid ] && kill $(cat /tmp/medibot-backend.pid) 2>/dev/null || true
    [ -f /tmp/medibot-ai-agent.pid ] && kill $(cat /tmp/medibot-ai-agent.pid) 2>/dev/null || true
    [ -f /tmp/medibot-web.pid ] && kill $(cat /tmp/medibot-web.pid) 2>/dev/null || true
    
    rm -f /tmp/medibot-*.pid
    echo -e "${GREEN}✓${NC} All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep running and show logs
tail -f /tmp/medibot-backend.log /tmp/medibot-ai-agent.log /tmp/medibot-web.log 2>/dev/null &
wait
