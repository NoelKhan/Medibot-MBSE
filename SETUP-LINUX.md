# 🐧 MediBot Setup Guide - Linux (Ubuntu/Debian)

Quick setup guide for Linux users to get MediBot running locally.

## 📋 Prerequisites Installation

### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

---

### 2. Install Node.js

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

---

### 3. Install Python

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip

# Verify
python3 --version  # Should show 3.11.x or higher
pip3 --version
```

---

### 4. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb medibot_db

# (Optional) Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Verify
psql --version
```

---

### 5. Install Redis

```bash
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return: PONG
```

---

### 6. Install Ollama

```bash
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve &

# Download model
ollama pull llama3.2

# Verify
ollama list
curl http://localhost:11434/api/tags
```

---

### 7. Install Git (if not installed)

```bash
sudo apt install -y git
git --version
```

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Automated Script

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
# Install Docker if not installed
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and back in for group changes

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
nano .env  # or vi, vim, gedit
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

# Or use netstat
sudo netstat -tlnp | grep -E '3001|8000|5173'

# Health checks
curl http://localhost:3001/api/health
curl http://localhost:8000/health

# Or open in browser
xdg-open http://localhost:5173
```

**Default login:**
- Email: `admin@medibot.com`
- Password: `admin123`

---

## 🔧 Common Linux Issues

### Port Already in Use

```bash
# Find and kill process
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9

# Or using fuser
sudo fuser -k 3001/tcp
sudo fuser -k 8000/tcp
```

### PostgreSQL Not Running

```bash
# Check status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Restart if needed
sudo systemctl restart postgresql

# Check if database exists
sudo -u postgres psql -l | grep medibot_db
```

### Redis Not Running

```bash
# Check status
sudo systemctl status redis-server

# Start Redis
sudo systemctl start redis-server

# Test connection
redis-cli ping
```

### Ollama Not Running

```bash
# Start in background
nohup ollama serve > /dev/null 2>&1 &

# Or as systemd service (create file: /etc/systemd/system/ollama.service)
sudo systemctl start ollama

# Check
curl http://localhost:11434/api/tags
```

### Permission Denied Errors

```bash
# PostgreSQL permissions
sudo -u postgres createdb medibot_db
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE medibot_db TO postgres;"

# File permissions
sudo chmod +x scripts/development/*.sh
sudo chmod +x scripts/utilities/*.sh

# Docker permissions
sudo usermod -aG docker $USER
# Log out and back in
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

# If permission issues
sudo chown -R $USER:$USER node_modules
```

### Firewall Issues

```bash
# Allow ports through UFW
sudo ufw allow 3001/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 5173/tcp

# Or disable firewall for development
sudo ufw disable
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

**System services:**
```bash
sudo systemctl stop postgresql
sudo systemctl stop redis-server
```

---

## 📱 Mobile App Setup (Optional)

**Find your IP:**
```bash
# Method 1
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 2
hostname -I

# Method 3
ifconfig | grep "inet " | grep -v 127.0.0.1
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
1. Install **Expo Go** from Play Store
2. Scan QR code from terminal
3. Ensure phone and computer are on same WiFi

**Test on Android emulator:**
```bash
# Install Android Studio first
npm run android
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
sudo systemctl status postgresql
sudo systemctl status redis-server
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
sudo -u postgres psql medibot_db
```

**Redis access:**
```bash
redis-cli
```

---

## 🔧 Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# Add to ~/.bashrc or ~/.zshrc
alias medibot-start="cd ~/Medibot-MBSE && ./scripts/development/start-all-services.sh"
alias medibot-stop="cd ~/Medibot-MBSE && ./scripts/development/stop-all.sh"
alias medibot-check="cd ~/Medibot-MBSE && ./scripts/utilities/check-services.sh"
alias medibot-logs="cd ~/Medibot-MBSE/infrastructure/docker && docker-compose logs -f"
```

Then:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

Now you can use:
```bash
medibot-start
medibot-stop
medibot-check
medibot-logs
```

---

## 🔧 Systemd Services (Optional)

Create systemd services for auto-start:

**Backend Service:**
```bash
sudo nano /etc/systemd/system/medibot-backend.service
```

```ini
[Unit]
Description=MediBot Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=yourusername
WorkingDirectory=/home/yourusername/Medibot-MBSE/medibot-backend
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable medibot-backend
sudo systemctl start medibot-backend
sudo systemctl status medibot-backend
```

---

## 🆘 Need Help?

1. **Check main README.md** for detailed documentation
2. **Review troubleshooting section** in main README
3. **Create issue:** https://github.com/NoelKhan/medibot-backend/issues

Include in your issue:
- Linux distribution and version (`lsb_release -a`)
- Error messages
- Steps you've tried
- Output of version checks

---

**🎉 You're all set! Happy coding!**
