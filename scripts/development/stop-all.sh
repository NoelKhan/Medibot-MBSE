#!/bin/bash

# ============================================
# MediBot Stop All Services
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping MediBot services...${NC}\n"

# Stop backend
if [ -f /tmp/medibot-backend.pid ]; then
    kill $(cat /tmp/medibot-backend.pid) 2>/dev/null && echo -e "${GREEN}✓${NC} Backend stopped"
    rm /tmp/medibot-backend.pid
fi

# Stop web
if [ -f /tmp/medibot-web.pid ]; then
    kill $(cat /tmp/medibot-web.pid) 2>/dev/null && echo -e "${GREEN}✓${NC} Web app stopped"
    rm /tmp/medibot-web.pid
fi

# Stop Vite processes
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✓${NC} Vite processes stopped"

# Stop Node processes related to medibot
pkill -f "nest start" 2>/dev/null && echo -e "${GREEN}✓${NC} NestJS processes stopped"

# Stop Docker containers (optional)
read -p "Stop Docker containers (PostgreSQL/Redis)? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$(dirname "$0")/../medibot-backend"
    docker-compose down
    echo -e "${GREEN}✓${NC} Docker containers stopped"
fi

echo -e "\n${GREEN}✅ All services stopped${NC}\n"
