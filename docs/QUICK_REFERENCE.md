# Quick Reference - What Changed & How to Run

## 🎯 What Was Done

### Backend Changes (3 files)
1. **chat.controller.ts** - Removed `@UseGuards(JwtAuthGuard)`
2. **ai-agent.controller.ts** - Removed `@UseGuards(JwtAuthGuard)`  
3. **conversation.entity.ts** (both copies) - Changed `userId` from `uuid` to `varchar(255)`, removed foreign key

### Web Changes (3 files)
1. **ChatApiService.ts** - Removed token property and methods
2. **ChatPage.tsx** - Removed token retrieval useEffect
3. **AuthContext.tsx** - Removed chatApiService token calls

### Result
- ✅ Web users can chat anonymously (no login required)
- ✅ Mobile users still use full authentication
- ✅ Other endpoints (bookings, profiles) still protected

---

## 🚀 How to Run

### Quick Start (Development)
```bash
# Terminal 1 - Start Backend
cd medibot-backend
npm run start:dev
# Runs on http://localhost:3001

# Terminal 2 - Start Web
cd medibot-web
npm run dev
# Runs on http://localhost:5173

# Terminal 3 - Start Mobile (optional)
cd medibot-mobile
npm start
```

### Docker (All services)
```bash
# From root directory
docker-compose -f infrastructure/docker/docker-compose.yml up

# Services:
# Backend: http://localhost:3001
# Web: http://localhost:3000
# AI Agent: http://localhost:8000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

---

## 🧪 Quick Test

```bash
# Test anonymous chat (should work ✅)
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!"}'

# Test protected endpoint (should fail with 401 ✅)
curl http://localhost:3001/api/bookings/appointments
```

---

## 📁 Key Files Changed

```
medibot-backend/
├── src/modules/chat/
│   ├── chat.controller.ts ✏️ MODIFIED
│   ├── dto/chat.dto.ts ✏️ MODIFIED
│   └── entities/conversation.entity.ts ✏️ MODIFIED
├── src/modules/ai-agent/
│   └── ai-agent.controller.ts ✏️ MODIFIED
└── src/database/entities/
    └── conversation.entity.ts ✏️ MODIFIED

medibot-web/
├── src/services/
│   └── ChatApiService.ts ✏️ MODIFIED
├── src/pages/
│   └── ChatPage.tsx ✏️ MODIFIED
└── src/contexts/
    └── AuthContext.tsx ✏️ MODIFIED

infrastructure/ ✅ ALL CONFIGS MOVED HERE
├── docker/
│   ├── backend/Dockerfile ✏️ MODIFIED
│   ├── web/Dockerfile ✏️ MODIFIED
│   └── docker-compose.yml ✏️ MODIFIED
└── k8s/ ✅ ALL K8S CONFIGS

docs/ ✅ NEW DOCUMENTATION
├── AUTHENTICATION_REMOVAL_COMPLETE.md 🆕
├── FINAL_VERIFICATION_CHECKLIST.md 🆕
└── QUICK_REFERENCE.md 🆕 (this file)
```

---

## 🔐 What's Protected vs Open

### Open (No Auth Required)
- ✅ Chat messages - `/api/chat/*`
- ✅ AI agent - `/api/ai/*`
- ✅ Health check - `/api/health`
- ✅ Login/Register - `/api/auth/login`, `/api/auth/register`

### Protected (Auth Required)
- 🔒 Bookings - `/api/bookings/*`
- 🔒 User profiles - `/api/users/*`
- 🔒 Appointments - `/api/bookings/appointments/*`
- 🔒 Medical records - `/api/users/:id/medical-history`
- 🔒 Emergencies - `/api/emergency/*`
- 🔒 Notifications - `/api/notifications/*`

---

## ✅ Status Check

```bash
# Check if backend is running
lsof -i:3001 && echo "✅ Backend running" || echo "❌ Backend not running"

# Check if web is running  
lsof -i:5173 && echo "✅ Web running" || echo "❌ Web not running"

# Test backend health
curl http://localhost:3001/api/health

# Test chat (anonymous)
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'
```

---

## 📊 Database Info

**Connection Details:**
- Host: localhost
- Port: 5432
- Database: medibot_db
- User: noelkhan (dev) or medibot_user (docker)

**Key Change:**
- `conversations.userId` is now `varchar(255)` (was `uuid`)
- Accepts both UUID strings and anonymous user IDs
- No foreign key constraint

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Kill any running process
lsof -ti:3001 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Clean and restart
cd medibot-backend
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

### Web won't build
```bash
cd medibot-web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Docker issues
```bash
# Stop all containers
docker-compose -f infrastructure/docker/docker-compose.yml down

# Remove volumes and restart
docker-compose -f infrastructure/docker/docker-compose.yml down -v
docker-compose -f infrastructure/docker/docker-compose.yml up --build
```

---

## 📞 Quick Commands Reference

```bash
# Build backend
cd medibot-backend && npm run build

# Build web
cd medibot-web && npm run build

# Start backend (dev)
cd medibot-backend && npm run start:dev

# Start web (dev)
cd medibot-web && npm run dev

# Start mobile
cd medibot-mobile && npm start

# Docker - build all
docker-compose -f infrastructure/docker/docker-compose.yml build

# Docker - start all
docker-compose -f infrastructure/docker/docker-compose.yml up

# Docker - stop all
docker-compose -f infrastructure/docker/docker-compose.yml down

# Check running services
docker-compose -f infrastructure/docker/docker-compose.yml ps

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f backend
```

---

## ✨ That's It!

Everything is working and documented. You're all set! 🎉

For detailed information, see:
- `/docs/AUTHENTICATION_REMOVAL_COMPLETE.md`
- `/docs/FINAL_VERIFICATION_CHECKLIST.md`
