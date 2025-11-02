# 🍎 MediBot Setup Guide - macOS

Quick setup guide for macOS users to get MediBot running locally.

## 📋 Prerequisites Installation

### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Verify:
```bash
brew --version
```

---

### 2. Install Node.js

```bash
brew install node@20
```

Verify:
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

---

### 3. Install Python

```bash
brew install python@3.11
```

Verify:
```bash
python3 --version  # Should show 3.11.x or higher
pip3 --version
```

---

### 4. Install PostgreSQL

```bash
brew install postgresql@14
brew services start postgresql@14
```

Create database:
```bash
createdb medibot_db
```

Verify:
```bash
psql --version
psql -l | grep medibot_db
```

---

### 5. Install Redis

```bash
brew install redis
brew services start redis
```

Verify:
```bash
redis-cli ping  # Should return: PONG
```

---

### 6. Install Ollama

```bash
brew install ollama
```

Start Ollama:
```bash
ollama serve
```

Download AI model (in new terminal):
```bash
ollama pull llama3.2
```

Verify:
```bash
ollama list
curl http://localhost:11434/api/tags
```

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Automated Script (Easiest)

```bash
# Clone repository
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE

# Make scripts executable
chmod +x scripts/development/*.sh
chmod +x scripts/utilities/*.sh

# Start all services
./scripts/development/start-all-services.sh

# Verify
./scripts/utilities/check-services.sh
```

### Option 2: Docker

```bash
# Clone repository
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE/infrastructure/docker

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### Option 3: Manual Setup

**Terminal 1 - Backend:**
```bash
cd Medibot-MBSE/medibot-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit with your settings
```

Edit `.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=medibot_db

REDIS_HOST=localhost
REDIS_PORT=6379

AI_AGENT_URL=http://localhost:8000
JWT_SECRET=your-secret-key-change-this

PORT=3001
NODE_ENV=development
```

Run migrations and start:
```bash
npm run migration:run
npm run start:dev
```

**Terminal 2 - AI Agent:**
```bash
cd Medibot-MBSE/medibot-backend/python/aiagent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
nano .env
```

Edit `.env`:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
API_HOST=0.0.0.0
API_PORT=8000
BACKEND_URL=http://localhost:3001
MAX_TOKENS=2000
TEMPERATURE=0.7
```

Start AI Agent:
```bash
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Web App (Optional):**
```bash
cd Medibot-MBSE/medibot-web

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_AGENT_URL=http://localhost:8000
```

Start web app:
```bash
npm run dev
```

---

## ✅ Verify Everything is Working

```bash
# Check services are running
lsof -i:3001  # Backend
lsof -i:8000  # AI Agent  
lsof -i:5173  # Web

# Health checks
curl http://localhost:3001/api/health
curl http://localhost:8000/health

# Or open in browser
open http://localhost:5173
```

**Default login:**
- Email: `admin@medibot.com`
- Password: `admin123`

---

## 🔧 Common macOS Issues

### Port Already in Use

```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### PostgreSQL Not Running

```bash
# Check status
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@14

# Restart if needed
brew services restart postgresql@14
```

### Redis Not Running

```bash
# Check status
brew services list | grep redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping
```

### Ollama Not Running

```bash
# Start in background
nohup ollama serve > /dev/null 2>&1 &

# Or run in separate terminal
ollama serve
```

### Python Virtual Environment Issues

```bash
cd medibot-backend/python/aiagent

# Remove old venv
rm -rf venv

# Create new venv
python3 -m venv venv

# Activate
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Node Modules Issues

```bash
# In problematic directory
rm -rf node_modules package-lock.json
npm install
```

---

## 🛑 Stopping Services

**Using scripts:**
```bash
./scripts/development/stop-all.sh
```

**Docker:**
```bash
cd infrastructure/docker
docker-compose down
```

**Manual:**
- Press `Ctrl+C` in each terminal

**Homebrew services:**
```bash
brew services stop postgresql@14
brew services stop redis
```

---

## 📱 Mobile App Setup (Optional)

**Find your IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Or check: System Preferences → Network
```

**Setup mobile app:**
```bash
cd medibot-mobile
npm install
npm install -g expo-cli

cp .env.example .env
nano .env
```

Edit `.env` with your IP:
```env
API_URL=http://192.168.1.100:3001/api      # Use your actual IP
AI_AGENT_URL=http://192.168.1.100:8000    # Use your actual IP
```

**Start:**
```bash
npm start
```

**Test on device:**
1. Install **Expo Go** from App Store
2. Use Camera to scan QR code
3. Ensure iPhone and Mac are on same WiFi

**Test on simulator:**
```bash
npm run ios
```

---

## 🔄 Daily Workflow

**Start your day:**
```bash
cd Medibot-MBSE

# Option 1: Automated
./scripts/development/start-all-services.sh

# Option 2: Docker
cd infrastructure/docker && docker-compose up -d

# Option 3: Manual (in separate terminals)
cd medibot-backend && npm run start:dev
cd medibot-backend/python/aiagent && source venv/bin/activate && python3 -m uvicorn app:app --reload
cd medibot-web && npm run dev
```

**End your day:**
```bash
# Option 1: Automated
./scripts/development/stop-all.sh

# Option 2: Docker
cd infrastructure/docker && docker-compose down

# Option 3: Manual
# Press Ctrl+C in each terminal
```

---

## 📚 Quick Commands

**Check versions:**
```bash
node --version
python3 --version
psql --version
redis-cli --version
ollama list
```

**Check services:**
```bash
brew services list
lsof -i:3001,8000,5173
```

**Health checks:**
```bash
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

**View logs (Docker):**
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f aiagent
```

**Database access:**
```bash
psql medibot_db
```

**Redis access:**
```bash
redis-cli
```

---

## 🔧 Useful Aliases (Add to ~/.zshrc)

```bash
# Add to ~/.zshrc
alias medibot-start="cd ~/path/to/Medibot-MBSE && ./scripts/development/start-all-services.sh"
alias medibot-stop="cd ~/path/to/Medibot-MBSE && ./scripts/development/stop-all.sh"
alias medibot-check="cd ~/path/to/Medibot-MBSE && ./scripts/utilities/check-services.sh"
alias medibot-logs="cd ~/path/to/Medibot-MBSE/infrastructure/docker && docker-compose logs -f"
```

Then:
```bash
source ~/.zshrc
```

Now you can use:
```bash
medibot-start
medibot-stop
medibot-check
medibot-logs
```

---

## 🆘 Need Help?

1. **Check main README.md** for detailed documentation
2. **Review troubleshooting section** in main README
3. **Create issue:** https://github.com/NoelKhan/medibot-backend/issues

Include in your issue:
- macOS version
- Error messages
- Steps you've tried
- Output of: `sw_vers` and version checks

---

**🎉 You're all set! Happy coding!**
