# 🪟 MediBot Setup Guide - Windows

Quick setup guide for Windows users to get MediBot running locally.

## 📋 Prerequisites Installation

### 1. Install Node.js

1. Download from [nodejs.org](https://nodejs.org/) (choose LTS version 20.x)
2. Run the installer
3. ✅ Keep all default options
4. **Restart your terminal** after installation

**Verify:**
```powershell
node --version
# Should show: v20.x.x
```

---

### 2. Install Python

1. Download from [python.org](https://www.python.org/downloads/) (3.11 or higher)
2. Run the installer
3. ✅ **IMPORTANT:** Check "Add Python to PATH"
4. Click "Install Now"
5. **Restart your terminal** after installation

**Verify:**
```powershell
python --version
# Should show: Python 3.11.x or higher
```

---

### 3. Install PostgreSQL

1. Download from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. **Remember the password** you set for the postgres user
4. Keep default port: 5432
5. Complete installation

**Add PostgreSQL to PATH:**
1. Search for "Environment Variables" in Start Menu
2. Click "Environment Variables"
3. Under "System Variables", find "Path"
4. Click "Edit" → "New"
5. Add: `C:\Program Files\PostgreSQL\14\bin`
6. Click OK

**Verify:**
```powershell
psql --version
```

**Create Database:**
```powershell
& "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres medibot_db
# Or use pgAdmin GUI to create database named 'medibot_db'
```

---

### 4. Install Redis

**Option A: Docker (Recommended)**
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop
3. Run Redis:
```powershell
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

**Option B: WSL2**
```powershell
# In PowerShell (as Administrator)
wsl --install
# Restart computer
# Then in WSL terminal:
sudo apt update
sudo apt install redis-server
redis-server
```

**Verify:**
```powershell
redis-cli ping
# Should return: PONG
```

---

### 5. Install Ollama

1. Download from [ollama.ai/download](https://ollama.ai/download)
2. Run the installer
3. Ollama starts automatically
4. Look for Ollama icon in system tray

**Download AI Model:**
```powershell
ollama pull llama3.2
```

**Verify:**
```powershell
ollama list
```

---

### 6. Install Git (if not already installed)

1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run installer with default options

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Docker (Easiest)

```powershell
# 1. Clone repository
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE\infrastructure\docker

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# Access at:
# Web: http://localhost:3000
# Backend: http://localhost:3001
# AI Agent: http://localhost:8000
```

### Option 2: Manual Setup

**Step 1: Clone Repository**
```powershell
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE
```

**Step 2: Setup Backend**
```powershell
cd medibot-backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env with your PostgreSQL password
notepad .env
```

**Edit `.env`:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=YOUR_POSTGRES_PASSWORD
DATABASE_NAME=medibot_db

REDIS_HOST=localhost
REDIS_PORT=6379

AI_AGENT_URL=http://localhost:8000
JWT_SECRET=change-this-secret-key

PORT=3001
NODE_ENV=development
```

**Run Migrations:**
```powershell
npm run migration:run
```

**Start Backend (keep this terminal open):**
```powershell
npm run start:dev
```

**Step 3: Setup AI Agent (in new PowerShell window)**
```powershell
cd Medibot-MBSE\medibot-backend\python\aiagent

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
notepad .env
```

**Edit `.env`:**
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
API_HOST=0.0.0.0
API_PORT=8000
BACKEND_URL=http://localhost:3001
MAX_TOKENS=2000
TEMPERATURE=0.7
```

**Start AI Agent (keep this terminal open):**
```powershell
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Step 4: Setup Web App (in new PowerShell window)**
```powershell
cd Medibot-MBSE\medibot-web

# Install dependencies
npm install

# Copy environment file
copy .env.example .env
notepad .env
```

**Edit `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_AGENT_URL=http://localhost:8000
```

**Start Web App (keep this terminal open):**
```powershell
npm run dev
```

**Step 5: Access Application**

Open browser: http://localhost:5173

**Login:**
- Email: `admin@medibot.com`
- Password: `admin123`

---

## ✅ Verify Everything is Working

**Check Services:**
```powershell
# Check Backend
Invoke-WebRequest -Uri http://localhost:3001/api/health | Select-Object -Expand Content

# Check AI Agent
Invoke-WebRequest -Uri http://localhost:8000/health | Select-Object -Expand Content

# Or open in browser:
Start-Process "http://localhost:3001/api/health"
Start-Process "http://localhost:8000/health"
Start-Process "http://localhost:5173"
```

**Check Running Services:**
```powershell
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :8000  # AI Agent
netstat -ano | findstr :5173  # Web
```

---

## 🔧 Common Windows Issues

### "Execution Policy" Error

**Problem:** `.\venv\Scripts\Activate.ps1 cannot be loaded`

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill process (replace PID with actual number)
taskkill /PID 1234 /F
```

### PostgreSQL Connection Failed

**Solution:**
1. Check PostgreSQL service is running:
```powershell
Get-Service -Name postgresql*
```

2. Start if needed:
```powershell
Start-Service postgresql-x64-14
```

3. Verify password in `.env` matches PostgreSQL installation

### Redis Connection Failed

**Solution:**
```powershell
# If using Docker:
docker ps | findstr redis
docker start redis

# Or create new container:
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Python Module Not Found

**Solution:**
```powershell
cd medibot-backend\python\aiagent

# Deactivate if active
deactivate

# Remove old venv
Remove-Item -Recurse -Force venv

# Create new venv
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Reinstall
pip install -r requirements.txt
```

### Node Modules Issues

**Solution:**
```powershell
# In the problematic directory (backend, web, or mobile)
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 🛑 Stopping Services

**Docker:**
```powershell
cd infrastructure\docker
docker-compose down
```

**Manual:**
- Press `Ctrl+C` in each PowerShell window

**Force Kill:**
```powershell
# Find and kill processes
taskkill /IM node.exe /F
taskkill /IM python.exe /F
```

---

## 📱 Mobile App Setup (Optional)

**Find Your IP Address:**
```powershell
ipconfig | findstr IPv4
# Look for: IPv4 Address. . . . . . . : 192.168.x.x
```

**Setup Mobile App:**
```powershell
cd medibot-mobile
npm install

copy .env.example .env
notepad .env
```

**Edit `.env` with your IP:**
```env
API_URL=http://192.168.1.100:3001/api
AI_AGENT_URL=http://192.168.1.100:8000
```

**Start:**
```powershell
npm start
```

**Test on Phone:**
1. Install **Expo Go** from Play Store or App Store
2. Scan QR code from terminal
3. Make sure phone and PC are on same WiFi

---

## 📚 Quick Commands

**Check Versions:**
```powershell
node --version
python --version
psql --version
redis-cli --version
ollama list
```

**Health Checks:**
```powershell
Invoke-WebRequest http://localhost:3001/api/health
Invoke-WebRequest http://localhost:8000/health
```

**View Logs (Docker):**
```powershell
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f aiagent
```

---

## 🆘 Need Help?

1. **Check main README.md** for detailed documentation
2. **Review troubleshooting section** in main README
3. **Create issue:** https://github.com/NoelKhan/medibot-backend/issues

Include in your issue:
- Windows version
- Error messages
- Steps you've tried
- Output of version checks

---

**🎉 You're all set! Happy coding!**
