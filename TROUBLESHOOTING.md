# 🔧 MediBot Troubleshooting Guide

Quick solutions to common issues across all platforms.

## 🚨 Emergency Fixes

### Nothing Works? Start Here

**Step 1: Check Prerequisites**
```bash
# Check if everything is installed
node --version     # Need 18.x or 20.x
python --version   # Need 3.11+
```

**Step 2: Use Docker Instead**
```bash
cd infrastructure/docker
docker-compose down -v
docker-compose up -d
```

Docker handles all dependencies automatically!

---

## 🔍 Quick Diagnostics

### Are Services Running?

**macOS/Linux:**
```bash
lsof -i:3001  # Backend
lsof -i:8000  # AI Agent
lsof -i:5173  # Web
```

**Windows:**
```powershell
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :8000  # AI Agent
netstat -ano | findstr :5173  # Web
```

**Docker:**
```bash
docker-compose ps
```

### Can You Reach Services?

**macOS/Linux:**
```bash
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

**Windows:**
```powershell
Invoke-WebRequest http://localhost:3001/api/health
Invoke-WebRequest http://localhost:8000/health
```

---

## ⚠️ Common Errors & Solutions

### "Port already in use" / "EADDRINUSE"

**macOS/Linux:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or for other ports
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Windows:**
```powershell
# Find process
netstat -ano | findstr :3001

# Kill it (replace 1234 with actual PID)
taskkill /PID 1234 /F
```

---

### "Cannot connect to database" / Database connection failed

#### Check PostgreSQL is Running

**macOS:**
```bash
brew services list | grep postgresql
brew services start postgresql@14
```

**Windows:**
```powershell
Get-Service -Name postgresql*
Start-Service postgresql-x64-14
```

**Linux:**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

#### Check Database Exists

**All Platforms:**
```bash
psql -l | grep medibot_db

# If not exists, create it:
createdb medibot_db  # macOS/Linux
# Windows: Use pgAdmin or createdb.exe
```

#### Check Environment Variables

Open `medibot-backend/.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password  # ⚠️ Must match PostgreSQL password
DATABASE_NAME=medibot_db
```

---

### "Redis connection failed" / ECONNREFUSED

#### Check Redis is Running

**macOS:**
```bash
brew services list | grep redis
brew services start redis
redis-cli ping  # Should return PONG
```

**Windows:**
```powershell
# If using Docker:
docker ps | findstr redis
docker start redis

# Or start new container:
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

**Linux:**
```bash
sudo systemctl status redis-server
sudo systemctl start redis-server
redis-cli ping
```

---

### "Ollama not found" / "Connection refused to Ollama"

#### Check Ollama is Running

**macOS:**
```bash
# Start Ollama
ollama serve

# Or in background:
nohup ollama serve > /dev/null 2>&1 &
```

**Windows:**
- Look for Ollama icon in system tray
- If not running, search "Ollama" in Start Menu
- Or download from https://ollama.ai/download

**Linux:**
```bash
ollama serve &
```

#### Check Model is Downloaded

**All Platforms:**
```bash
ollama list

# If empty, download model:
ollama pull llama3.2

# Verify it works:
ollama run llama3.2 "Hello"
```

---

### "Module not found" / "Cannot find package"

#### Backend/Web/Mobile

**All Platforms:**
```bash
# Navigate to problematic folder
cd medibot-backend  # or medibot-web, medibot-mobile

# Clean and reinstall
rm -rf node_modules package-lock.json  # macOS/Linux
# Windows: Remove-Item -Recurse -Force node_modules, package-lock.json

npm install
```

#### AI Agent (Python)

**macOS/Linux:**
```bash
cd medibot-backend/python/aiagent

# Remove old virtual environment
rm -rf venv

# Create new one
python3 -m venv venv
source venv/bin/activate

# Reinstall
pip install -r requirements.txt
```

**Windows:**
```powershell
cd medibot-backend\python\aiagent

# Remove old virtual environment
Remove-Item -Recurse -Force venv

# Create new one
python -m venv venv
.\venv\Scripts\Activate.ps1

# If execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Reinstall
pip install -r requirements.txt
```

---

### "Cannot activate virtual environment" (Windows)

**Error:** `cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try again:
```powershell
.\venv\Scripts\Activate.ps1
```

---

### API Not Connecting / CORS Errors

#### Check Backend is Running

**All Platforms:**
```bash
# Should see output from NestJS
# If not, check terminal for errors
```

#### Check .env Files

**Backend (.env):**
```env
PORT=3001
NODE_ENV=development
```

**Web (.env):**
```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_AGENT_URL=http://localhost:8000
```

#### Restart Dev Server

```bash
# Stop with Ctrl+C, then:
npm run dev  # or npm run start:dev
```

---

### Mobile App Can't Connect

#### Most Common Issue: Using localhost

❌ **Wrong:**
```env
API_URL=http://localhost:3001/api
```

✅ **Correct:**
```env
API_URL=http://192.168.1.100:3001/api  # Your computer's actual IP
```

#### Find Your IP Address

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Or: System Preferences → Network
```

**Windows:**
```powershell
ipconfig | findstr IPv4
# Or: Settings → Network & Internet → Properties
```

**Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# Or: hostname -I
```

#### Check Firewall

**macOS:**
- System Preferences → Security & Privacy → Firewall
- Allow Node.js incoming connections

**Windows:**
- Windows Defender Firewall → Allow an app
- Add Node.js to allowed apps

**Linux:**
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 8000/tcp
```

#### Try Tunnel Mode

```bash
npm start -- --tunnel
```

---

### Docker Issues

#### Containers Won't Start

```bash
# View logs
docker-compose logs backend
docker-compose logs aiagent

# Restart specific service
docker-compose restart backend
```

#### Port Conflicts

```bash
# Stop everything
docker-compose down

# Check what's using ports
# macOS/Linux:
lsof -i:3001

# Windows:
netstat -ano | findstr :3001

# Kill conflicting processes, then:
docker-compose up -d
```

#### Build Failures

```bash
# Clean build
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔄 Nuclear Option: Complete Reset

When nothing else works, start fresh:

### Method 1: Clean Reinstall

**macOS/Linux:**
```bash
cd Medibot-MBSE

# Stop everything
./scripts/development/stop-all.sh

# Remove all dependencies
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "venv" -type d -prune -exec rm -rf '{}' +
find . -name "package-lock.json" -delete

# Reinstall
cd medibot-backend && npm install
cd python/aiagent && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
cd ../../medibot-web && npm install
cd ../medibot-mobile && npm install
```

**Windows:**
```powershell
cd Medibot-MBSE

# Stop all terminals (Ctrl+C)

# Remove dependencies
Get-ChildItem -Path . -Include node_modules -Recurse -Force | Remove-Item -Recurse -Force
Get-ChildItem -Path . -Include venv -Recurse -Force | Remove-Item -Recurse -Force
Get-ChildItem -Path . -Include package-lock.json -Recurse -Force | Remove-Item -Force

# Reinstall
cd medibot-backend; npm install
cd python\aiagent; python -m venv venv; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt
cd ..\..\medibot-web; npm install
cd ..\medibot-mobile; npm install
```

### Method 2: Use Docker

```bash
cd infrastructure/docker
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Performance Issues

### Backend is Slow

- Check PostgreSQL connection pool settings
- Monitor Redis memory usage
- Check for database migration issues

### AI Agent is Slow

- Try a smaller model: `ollama pull llama3.2` (2GB)
- Close other applications
- Check CPU/RAM usage

### Web App is Slow

```bash
# Clear build cache
rm -rf .vite node_modules/.vite
npm run dev
```

---

## 🆘 Still Stuck?

### Before Asking for Help

1. **Check which version you're using:**
   ```bash
   git log -1 --oneline
   ```

2. **Gather system info:**
   - OS and version
   - `node --version`
   - `python --version`
   - Error messages (full text)

3. **Try Docker method** if manual setup fails

### Get Help

1. **Search existing issues:** https://github.com/NoelKhan/medibot-backend/issues
2. **Create new issue** with:
   - Platform (Windows/macOS/Linux)
   - Steps you've tried
   - Full error messages
   - System info

3. **Check platform-specific guides:**
   - [Windows Setup Guide](SETUP-WINDOWS.md)
   - [macOS Setup Guide](SETUP-MACOS.md)
   - [Linux Setup Guide](SETUP-LINUX.md)

---

## 📚 Additional Resources

- **Main README:** [README.md](README.md)
- **CI/CD Issues:** Check `.github/workflows/` for pipeline errors
- **Database Migrations:** Check `medibot-backend/migrations/`
- **API Documentation:** http://localhost:8000/docs (when AI agent is running)

---

**Remember: Docker is your friend! When in doubt, use `docker-compose up -d`** 🐳
