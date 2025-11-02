# 🚀 MediBot Quick Start Guide

**Get MediBot running in 5 minutes!**

---

## ⚡ Fastest Way (Automated)

```bash
# 1. Clone repository
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE

# 2. Start everything
chmod +x scripts/development/*.sh
./scripts/development/start-all-services.sh

# 3. Check status
./scripts/utilities/check-services.sh
```

**Access:**
- Web App: http://localhost:5173
- Backend: http://localhost:3001/api/health
- AI Agent: http://localhost:8000/health

---

## 📝 Manual Setup (Step by Step)

### Prerequisites Check

```bash
node --version    # Need v18+ or v20+
python3 --version # Need v3.11+
psql --version    # Need v14+
redis-cli --version # Need v7+
curl http://localhost:11434/api/tags # Ollama should return JSON
```

### 1. Backend (2 minutes)

```bash
cd medibot-backend
npm install
createdb medibot_db
cp .env.example .env
# Edit .env with your database credentials
npm run start:dev
```

Test: `curl http://localhost:3001/api/health`

### 2. AI Agent (2 minutes)

```bash
# Install Ollama model (choose one)
ollama pull llama3.2      # Fastest, 2GB
ollama pull medllama2     # Medical-specific, 3.8GB

# Start AI Agent
cd medibot-backend/python/aiagent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: OLLAMA_MODEL=llama3.2
python3 -m uvicorn app:app --reload
```

Test: `curl http://localhost:8000/health`

### 3. Web App (1 minute)

```bash
cd medibot-web
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3001/api
npm run dev:node
```

Access: http://localhost:5173

### 4. Mobile App (Optional)

```bash
cd medibot-mobile
npm install
npm start
# Scan QR with Expo Go app
```

---

## 🧪 Test Everything

```bash
# Test Backend + AI Integration
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "I have a headache"}'
```

Should return AI analysis with symptoms and recommendations.

---

## 🐳 Docker (Alternative)

```bash
cd infrastructure/docker
docker-compose up -d
```

Everything starts automatically!

---

## 🔧 Common Fixes

**Backend won't start:**
```bash
lsof -ti:3001 | xargs kill -9
brew services start postgresql@14
```

**AI Agent errors:**
```bash
ollama serve  # Start Ollama
ollama list   # Check models installed
```

**Web build errors:**
```bash
cd medibot-web
rm -rf node_modules package-lock.json
npm install
npm run dev:node  # Use node, not bun
```

---

## 📚 Full Documentation

See [README.md](./README.md) for complete setup, deployment, and CI/CD documentation.

---

## 🎯 What's Running?

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| Backend API | 3001 | http://localhost:3001 |
| AI Agent | 8000 | http://localhost:8000 |
| Web App | 5173 | http://localhost:5173 |
| Ollama | 11434 | http://localhost:11434 |

---

**Need help?** Check [/docs](./docs/) or create an issue!
