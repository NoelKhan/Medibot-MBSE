# 🏥 MediBot - AI-Powered Healthcare Platform

[![CI/CD](https://github.com/NoelKhan/medibot-backend/actions/workflows/complete-stack-cicd.yml/badge.svg)](https://github.com/NoelKhan/medibot-backend/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x%20|%2020.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)

**A complete healthcare management monorepo** featuring AI-powered medical assistance, patient records, appointment scheduling, and telemedicine. Includes backend API, AI agent with LLM models, web dashboard, and mobile app.

> **🎯 New to the project?** Jump to our platform-specific setup guides:
> - [Windows Setup Guide](SETUP-WINDOWS.md) - Complete guide for Windows users
> - [macOS Setup Guide](SETUP-MACOS.md) - Complete guide for macOS users  
> - [Linux Setup Guide](SETUP-LINUX.md) - Complete guide for Linux users
> - [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions

---

## ⚡ Quick Start (5 Minutes)

> **📖 Platform-Specific Guides Available:**
> - **Windows Users:** See [SETUP-WINDOWS.md](SETUP-WINDOWS.md) for detailed Windows setup
> - **macOS Users:** See [SETUP-MACOS.md](SETUP-MACOS.md) for detailed macOS setup  
> - **Linux Users:** See [SETUP-LINUX.md](SETUP-LINUX.md) for detailed Linux setup

### Option 1: Automated Setup (macOS/Linux)

```bash
# 1. Clone repository
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE

# 2. Start all services automatically
chmod +x scripts/development/*.sh
./scripts/development/start-all-services.sh

# 3. Verify services
./scripts/utilities/check-services.sh
```

### Option 2: Docker (All Platforms - Recommended for Windows)

```bash
# 1. Clone repository
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE/infrastructure/docker

# 2. Start all services with Docker
docker-compose up -d

# 3. Check status
docker-compose ps
```

**🎉 Done! Access your services:**
- 🌐 **Web Dashboard**: http://localhost:5173 (or http://localhost:3000 for Docker)
- 🔌 **Backend API**: http://localhost:3001/api/health  
- 🤖 **AI Agent**: http://localhost:8000/health

---

## 📋 Table of Contents

- [What's Included](#-whats-included)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
  - [1. Backend + Database](#1-backend--database)
  - [2. AI Agent + LLM Models](#2-ai-agent--llm-models)
  - [3. Web Dashboard](#3-web-dashboard-optional)
  - [4. Mobile App](#4-mobile-app-optional)
- [Testing](#-testing)
- [Deployment](#-deployment)
  - [Docker (Recommended)](#docker-all-in-one---recommended-for-all-platforms)
  - [Kubernetes (Production)](#kubernetes-production)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Troubleshooting](#-troubleshooting)
- [Quick Reference](#-quick-reference)

**📖 Additional Guides:**
- **[Windows Setup](SETUP-WINDOWS.md)** - Detailed Windows installation guide
- **[macOS Setup](SETUP-MACOS.md)** - Detailed macOS installation guide
- **[Linux Setup](SETUP-LINUX.md)** - Detailed Linux installation guide
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🎯 What's Included

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **Backend API** | NestJS + TypeORM + PostgreSQL + Redis | 3001 | Patient records, appointments, authentication |
| **AI Agent** | Python FastAPI + Ollama + LangChain | 8000 | Medical symptom analysis, triage, AI chat |
| **Web Dashboard** | React 18 + Vite + Material-UI v7 | 5173 | Healthcare provider interface |
| **Mobile App** | React Native + Expo | - | Patient mobile application |

**Key Features:**
- 💬 AI medical chatbot with symptom analysis
- 📅 Appointment scheduling and management
- 📊 Patient health records and history
- 🎯 Emergency triage assessment
- 📱 Cross-platform mobile support
- 🔐 Secure authentication

---

## 📋 Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 8GB | 16GB+ |
| **Disk Space** | 10GB | 20GB+ |
| **OS** | macOS 11+, Windows 10+, Ubuntu 20.04+ | Latest versions |

### Required Software

<details>
<summary><b>📦 Node.js 18.x or 20.x</b></summary>

**macOS:**
```bash
brew install node@20
```

**Windows:**
- Download installer from [nodejs.org](https://nodejs.org/)
- Run installer and follow prompts
- Restart terminal after installation

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify:**
```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```
</details>

<details>
<summary><b>🐍 Python 3.11+</b></summary>

**macOS:**
```bash
brew install python@3.11
```

**Windows:**
- Download installer from [python.org](https://www.python.org/downloads/)
- ✅ **IMPORTANT:** Check "Add Python to PATH" during installation
- Restart terminal after installation

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

**Verify:**
```bash
python3 --version    # Should show 3.11.x or higher
pip3 --version       # Should show pip version
```
</details>

<details>
<summary><b>🐘 PostgreSQL 14+</b></summary>

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
- Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run installer (remember the password you set!)
- Add PostgreSQL bin to PATH: `C:\Program Files\PostgreSQL\14\bin`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Verify:**
```bash
psql --version    # Should show 14.x or higher

# macOS/Linux: Test connection
psql postgres

# Windows (PowerShell): Test connection
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres
```
</details>

<details>
<summary><b>🔴 Redis 7+</b></summary>

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
- Download from [redis.io/download](https://redis.io/download) or use WSL2
- **Easiest:** Use Docker: `docker run -d -p 6379:6379 redis:7-alpine`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Verify:**
```bash
redis-cli ping    # Should return "PONG"
```
</details>

<details>
<summary><b>🤖 Ollama (for AI)</b></summary>

**macOS:**
```bash
brew install ollama
ollama serve
```

**Windows:**
- Download installer from [ollama.ai/download](https://ollama.ai/download)
- Run installer
- Ollama will start automatically

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
```

**Verify:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags
# Should return JSON with model list
```
</details>

### Optional Software

<details>
<summary><b>🐳 Docker & Docker Compose (Recommended for Windows users)</b></summary>

**All Platforms:**
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Install and start Docker Desktop
- Docker Compose is included

**Verify:**
```bash
docker --version
docker-compose --version
```
</details>

<details>
<summary><b>📱 Expo CLI (for mobile development)</b></summary>

**All Platforms:**
```bash
npm install -g expo-cli
expo --version
```
</details>

### Quick Prerequisites Check

Run this to verify all installations:

**macOS/Linux:**
```bash
echo "Node: $(node --version)"
echo "Python: $(python3 --version)"
echo "PostgreSQL: $(psql --version)"
echo "Redis: $(redis-cli --version)"
echo "Ollama: $(curl -s http://localhost:11434/api/tags | grep -o 'models' || echo 'Not running')"
```

**Windows (PowerShell):**
```powershell
Write-Host "Node: $(node --version)"
Write-Host "Python: $(python --version)"
Write-Host "PostgreSQL: $(psql --version)"
Write-Host "Redis: $(redis-cli --version)"
Write-Host "Ollama: $(try { (Invoke-WebRequest -Uri http://localhost:11434/api/tags).StatusCode } catch { 'Not running' })"
```

---

## 🛠️ Installation Guide

### 1. Backend + Database

#### Step 1.1: Start PostgreSQL & Redis

<details>
<summary><b>macOS</b></summary>

```bash
# Start services
brew services start postgresql@14
brew services start redis

# Create database
createdb medibot_db
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
# PostgreSQL starts automatically after installation
# Check if running:
Get-Service -Name postgresql*

# Create database (PowerShell)
& "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres medibot_db

# Or use pgAdmin (GUI) to create database named 'medibot_db'

# Start Redis (if using Docker)
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Or if installed via WSL
wsl redis-server
```
</details>

<details>
<summary><b>Linux</b></summary>

```bash
# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server

# Create database
sudo -u postgres createdb medibot_db
```
</details>

#### Step 1.2: Install Backend Dependencies

```bash
# Navigate to backend folder
cd medibot-backend

# Install dependencies
npm install
```

#### Step 1.3: Configure Environment

**macOS/Linux:**
```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

**Windows:**
```powershell
copy .env.example .env
notepad .env  # or use VS Code: code .env
```

**Required `.env` settings:**
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password     # Use the password you set during PostgreSQL installation
DATABASE_NAME=medibot_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Agent
AI_AGENT_URL=http://localhost:8000

# Security
JWT_SECRET=your-super-secret-key-change-this

# Server
PORT=3001
NODE_ENV=development
```

#### Step 1.4: Run Database Migrations

```bash
# Run migrations to create tables
npm run migration:run
```

#### Step 1.5: Start Backend

**macOS/Linux:**
```bash
npm run start:dev
```

**Windows (PowerShell):**
```powershell
npm run start:dev
```

#### Step 1.6: Test Backend

**macOS/Linux:**
```bash
curl http://localhost:3001/api/health
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/health | Select-Object -Expand Content
```

**Expected Response:**
```json
{"status":"ok","info":{"database":{"status":"up"},...}}
```

---

### 2. AI Agent + LLM Models

#### Step 2.1: Install Ollama

<details>
<summary><b>macOS</b></summary>

```bash
# Install Ollama
brew install ollama

# Start Ollama service
ollama serve
```
</details>

<details>
<summary><b>Windows</b></summary>

1. Download installer from [ollama.ai/download](https://ollama.ai/download)
2. Run the installer
3. Ollama starts automatically as a service
4. Verify it's running by opening http://localhost:11434 in your browser
</details>

<details>
<summary><b>Linux</b></summary>

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve
```
</details>

#### Step 2.2: Choose Your AI Model

Pick based on your computer's RAM:

| Model | Size | RAM Needed | Best For | Install Command |
|-------|------|------------|----------|-----------------|
| **Llama 3.2** ⭐ | 2GB | 8GB | Fast, general purpose | `ollama pull llama3.2` |
| **MedLlama2** | 3.8GB | 8GB | Medical-specific | `ollama pull medllama2` |
| **Llama 2 (7B)** | 3.8GB | 8GB | Medical fine-tuning | `ollama pull llama2:7b` |
| **Llama 3.1** | 4.7GB | 16GB | Advanced | `ollama pull llama3.1` |
| **Mistral** | 4.1GB | 8GB | Fast & efficient | `ollama pull mistral` |

**Recommended (All Platforms):**
```bash
ollama pull llama3.2
```

**Verify:**
```bash
ollama list
ollama run llama3.2 "What causes headaches?"
```

#### Step 2.3: Setup AI Agent

**macOS/Linux:**
```bash
cd medibot-backend/python/aiagent

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Windows (PowerShell):**
```powershell
cd medibot-backend\python\aiagent

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt
```

#### Step 2.4: Configure AI Agent

**macOS/Linux:**
```bash
cp .env.example .env
nano .env
```

**Windows:**
```powershell
copy .env.example .env
notepad .env
```

**Required `.env` for AI Agent:**
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
API_HOST=0.0.0.0
API_PORT=8000
BACKEND_URL=http://localhost:3001
MAX_TOKENS=2000
TEMPERATURE=0.7
```

#### Step 2.5: Start AI Agent

**macOS/Linux:**
```bash
# Make sure venv is activated
source venv/bin/activate

# Start AI Agent
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Windows:**
```powershell
# Make sure venv is activated
.\venv\Scripts\Activate.ps1

# Start AI Agent
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

#### Step 2.6: Test AI Agent

**macOS/Linux:**
```bash
curl http://localhost:8000/health
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health | Select-Object -Expand Content
```

**Expected Response:**
```json
{"status":"healthy","services":{"ollama":"connected",...}}
```

---

### 3. Web Dashboard (Optional)

#### Step 3.1: Install Dependencies

```bash
cd medibot-web
npm install
```

#### Step 3.2: Configure Environment

**macOS/Linux:**
```bash
cp .env.example .env
```

**Windows:**
```powershell
copy .env.example .env
```

**Required `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_AGENT_URL=http://localhost:8000
```

#### Step 3.3: Start Web App

```bash
npm run dev
```

**Access:** http://localhost:5173

**Default credentials:**
- Email: `admin@medibot.com`
- Password: `admin123`

---

### 4. Mobile App (Optional)

#### Step 4.1: Install Dependencies

```bash
cd medibot-mobile
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli
```

#### Step 4.2: Configure Environment

**macOS/Linux:**
```bash
cp .env.example .env
```

**Windows:**
```powershell
copy .env.example .env
```

#### Step 4.3: Find Your Computer's IP Address

**⚠️ Important:** Mobile devices need your computer's actual IP address, not `localhost`

<details>
<summary><b>macOS</b></summary>

```bash
# Method 1: Using ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# Method 2: Using System Preferences
# Go to System Preferences → Network → Your connection
# Look for "IP Address"
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
# Method 1: Using ipconfig
ipconfig | findstr IPv4

# Method 2: Using Settings
# Settings → Network & Internet → Properties
# Look for "IPv4 address"
```
</details>

<details>
<summary><b>Linux</b></summary>

```bash
# Method 1: Using ip command
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 2: Using hostname
hostname -I
```
</details>

#### Step 4.4: Update Environment Variables

Edit `.env` with your IP address:

```env
# Replace YOUR_COMPUTER_IP with the IP address you found
API_URL=http://192.168.1.100:3001/api        # Example IP
AI_AGENT_URL=http://192.168.1.100:8000      # Example IP
```

**Example:**
- If your IP is `192.168.1.100`, use:
  - `API_URL=http://192.168.1.100:3001/api`
  - `AI_AGENT_URL=http://192.168.1.100:8000`

#### Step 4.5: Start Mobile App

```bash
npm start
```

This will:
- Start the Metro bundler
- Display a QR code
- Provide options to run on emulator/simulator

#### Step 4.6: Test on Physical Device

1. **Install Expo Go** on your phone:
   - iOS: Download from [App Store](https://apps.apple.com/us/app/expo-go/id982107779)
   - Android: Download from [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR Code:**
   - iOS: Use Camera app to scan QR code from terminal
   - Android: Use Expo Go app to scan QR code

3. **Troubleshooting Connection:**
   - Make sure phone and computer are on the same WiFi network
   - Check firewall isn't blocking ports 3001, 8000, 8081
   - Try running with tunnel: `npm start -- --tunnel`

#### Step 4.7: Run on Emulator/Simulator

**Android Emulator (All Platforms):**
```bash
# Start Android emulator first (Android Studio)
# Then run:
npm run android
```

**iOS Simulator (macOS only):**
```bash
# Requires Xcode to be installed
npm run ios
```

**Windows Subsystem for Android (Windows 11):**
```bash
# If you have WSA installed
npm run android
```

---

## 🧪 Testing

### Quick Health Check for All Services

<details>
<summary><b>macOS/Linux</b></summary>

```bash
# Automated health check (if scripts work)
./scripts/utilities/check-services.sh

# Or manually check ports
lsof -i:3001  # Backend
lsof -i:8000  # AI Agent
lsof -i:5173  # Web

# Check service health
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```
</details>

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
# Check if ports are in use
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :8000  # AI Agent
netstat -ano | findstr :5173  # Web

# Check service health
Invoke-WebRequest -Uri http://localhost:3001/api/health
Invoke-WebRequest -Uri http://localhost:8000/health

# Or open in browser
Start-Process "http://localhost:3001/api/health"
Start-Process "http://localhost:8000/health"
Start-Process "http://localhost:5173"
```
</details>

### Test AI Integration

<details>
<summary><b>macOS/Linux</b></summary>

```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "I have a fever and cough"}'
```
</details>

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
$body = @{
    content = "I have a fever and cough"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/chat/message `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```
</details>

Should return AI analysis with symptoms and recommendations.

### Run Test Suites

**All Platforms:**

```bash
# Test all services (macOS/Linux only)
./scripts/testing/test-all.sh

# Test individual services
cd medibot-backend && npm test
cd medibot-web && npm test  
cd medibot-mobile && npm test
```

---

## 🚀 Deployment

### Docker (All-in-One) - Recommended for All Platforms

**Perfect for:** Testing, demos, simple deployments, Windows users

**Prerequisites:**
- Docker Desktop installed and running

**Step 1: Navigate to Docker folder**
```bash
cd infrastructure/docker
```

**Step 2: Start all services**
```bash
docker-compose up -d
```

**Step 3: View logs (optional)**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f aiagent
```

**Step 4: Check status**
```bash
docker-compose ps
```

**Access services:**
- Backend: http://localhost:3001
- AI Agent: http://localhost:8000
- Web: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

**Stop services:**
```bash
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Update after code changes:**
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

---

### Kubernetes (Production)

**Perfect for:** Production, auto-scaling, high availability, cloud deployments

**Prerequisites:**
- kubectl installed
- Access to a Kubernetes cluster (AWS EKS, GKE, AKS, or local with Minikube)

#### Step 1: Create Namespace

```bash
kubectl create namespace medibot-prod
```

#### Step 2: Create Secrets

<details>
<summary><b>PostgreSQL Secret</b></summary>

```bash
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres \
  --from-literal=password=your-secure-password \
  -n medibot-prod
```
</details>

<details>
<summary><b>JWT Secret</b></summary>

```bash
kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret-key \
  -n medibot-prod
```
</details>

<details>
<summary><b>API Keys (if needed)</b></summary>

```bash
kubectl create secret generic api-keys \
  --from-literal=openai-key=your-key \
  -n medibot-prod
```
</details>

#### Step 3: Deploy Services

```bash
cd infrastructure/k8s

# Deploy in order
kubectl apply -f backend/postgres-statefulset.yaml -n medibot-prod
kubectl apply -f backend/redis-deployment.yaml -n medibot-prod
kubectl apply -f backend/ollama-statefulset.yaml -n medibot-prod
kubectl apply -f backend/backend-deployment.yaml -n medibot-prod
kubectl apply -f backend/ai-agent-deployment.yaml -n medibot-prod
kubectl apply -f web/web-deployment.yaml -n medibot-prod
kubectl apply -f ingress.yaml -n medibot-prod
kubectl apply -f hpa.yaml -n medibot-prod
```

#### Step 4: Verify Deployment

```bash
# Check all resources
kubectl get all -n medibot-prod

# Check pods status
kubectl get pods -n medibot-prod

# Check services
kubectl get svc -n medibot-prod

# Check logs if needed
kubectl logs -f deployment/backend -n medibot-prod
```

#### Step 5: Access Services

**With LoadBalancer:**
```bash
kubectl get svc -n medibot-prod
# Look for EXTERNAL-IP
```

**With Port Forwarding (for testing):**
```bash
# Backend
kubectl port-forward svc/backend 3001:3001 -n medibot-prod

# AI Agent
kubectl port-forward svc/ai-agent 8000:8000 -n medibot-prod

# Web
kubectl port-forward svc/web 3000:80 -n medibot-prod
```

#### Automated Deployment

**Use the deploy script:**

**macOS/Linux:**
```bash
cd infrastructure/k8s
chmod +x deploy.sh
./deploy.sh
```

**Windows (PowerShell):**
```powershell
cd infrastructure\k8s
# Run commands from deploy.sh manually
# Or use WSL: wsl ./deploy.sh
```

---

### Cloud Platform Deployment

#### AWS (Elastic Container Service)

<details>
<summary><b>Quick Deploy to AWS ECS</b></summary>

1. **Setup AWS CLI:**
   ```bash
   aws configure
   ```

2. **Deploy Backend:**
   ```bash
   cd medibot-backend
   aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
   ```

3. **Use GitHub Actions:**
   - Push to `main` branch
   - Workflow automatically deploys to ECS
   - Check `.github/workflows/backend-cicd.yml`
</details>

#### Google Cloud (GKE)

<details>
<summary><b>Quick Deploy to GKE</b></summary>

1. **Create GKE cluster:**
   ```bash
   gcloud container clusters create medibot-cluster \
     --num-nodes=3 \
     --zone=us-central1-a
   ```

2. **Get credentials:**
   ```bash
   gcloud container clusters get-credentials medibot-cluster
   ```

3. **Deploy with kubectl:**
   ```bash
   kubectl apply -f infrastructure/k8s/
   ```
</details>

#### Azure (AKS)

<details>
<summary><b>Quick Deploy to AKS</b></summary>

1. **Create AKS cluster:**
   ```bash
   az aks create \
     --resource-group medibot-rg \
     --name medibot-cluster \
     --node-count 3 \
     --enable-addons monitoring
   ```

2. **Get credentials:**
   ```bash
   az aks get-credentials \
     --resource-group medibot-rg \
     --name medibot-cluster
   ```

3. **Deploy with kubectl:**
   ```bash
   kubectl apply -f infrastructure/k8s/
   ```
</details>

#### Heroku (Simple Deployment)

<details>
<summary><b>Deploy Backend to Heroku</b></summary>

```bash
# Install Heroku CLI
# macOS: brew install heroku
# Windows: Download from heroku.com

# Login
heroku login

# Create apps
heroku create medibot-backend
heroku create medibot-web

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev --app medibot-backend

# Add Redis
heroku addons:create heroku-redis:hobby-dev --app medibot-backend

# Deploy backend
cd medibot-backend
git push heroku main

# Deploy web
cd medibot-web
git push heroku main
```
</details>

---

## 🔄 CI/CD Pipeline

Our GitHub Actions workflow (`/.github/workflows/complete-stack-cicd.yml`) automatically:

**Phase 1: Build & Test**
- Backend + AI Agent builds (parallel)
- Run unit tests with PostgreSQL/Redis

**Phase 2: Docker Images**  
- Build & push to GitHub Container Registry (ghcr.io)

**Phase 3: Web Build**
- React app build + Docker image

**Phase 4: Mobile Build**
- React Native + Expo APK generation

**Phase 5: Kubernetes Deploy**
- Auto-deploy staging (develop branch)
- Auto-deploy production (main branch)

**Phase 6: Integration Tests**
- Health checks + API tests

### Setup GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo authentication token |
| `KUBE_CONFIG` | Base64 encoded kubeconfig |
| `VITE_API_URL` | Web app API URL (e.g., https://api.medibot.com) |
| `VITE_AI_AGENT_URL` | AI agent URL (e.g., https://ai.medibot.com) |
| `BACKEND_URL` | Backend health check URL |
| `AI_AGENT_URL` | AI health check URL |

**Trigger workflow:**
```bash
git push origin main  # Auto-triggers
# Or manually via GitHub Actions tab
```

---

## 🔧 Troubleshooting

### Common Issues - All Platforms

#### "Port already in use" Error

<details>
<summary><b>macOS/Linux</b></summary>

```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# For other ports
lsof -ti:8000 | xargs kill -9  # AI Agent
lsof -ti:5173 | xargs kill -9  # Web
```
</details>

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
# Find process ID using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Example:
taskkill /PID 12345 /F
```
</details>

---

### Backend Issues

#### Database Connection Failed

<details>
<summary><b>macOS</b></summary>

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql@14

# Verify database exists
psql -l | grep medibot_db

# Create if missing
createdb medibot_db
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start service if stopped
Start-Service postgresql-x64-14  # Adjust version number

# Create database using pgAdmin or:
& "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres medibot_db
```
</details>

<details>
<summary><b>Linux</b></summary>

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb medibot_db
```
</details>

#### Redis Connection Failed

<details>
<summary><b>macOS</b></summary>

```bash
# Check if Redis is running
brew services list | grep redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping  # Should return PONG
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
# If using Docker
docker ps | findstr redis
docker start redis  # If stopped

# Or start Redis container
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Test connection
redis-cli ping
```
</details>

<details>
<summary><b>Linux</b></summary>

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start Redis
sudo systemctl start redis-server

# Test connection
redis-cli ping
```
</details>

#### "Module not found" or "Cannot find package"

**All Platforms:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json  # macOS/Linux
# Or
Remove-Item -Recurse -Force node_modules, package-lock.json  # Windows PowerShell

npm install
```

---

### AI Agent Issues

#### Ollama Not Running

<details>
<summary><b>macOS</b></summary>

```bash
# Start Ollama
ollama serve

# Or run in background
nohup ollama serve > /dev/null 2>&1 &
```
</details>

<details>
<summary><b>Windows</b></summary>

- Check if Ollama is running in system tray
- If not, search for "Ollama" in Start Menu and launch it
- Or restart the Ollama service:
  1. Open Task Manager
  2. Go to Services tab
  3. Find "Ollama" and restart it
</details>

<details>
<summary><b>Linux</b></summary>

```bash
# Start Ollama
ollama serve

# Or run as systemd service
sudo systemctl start ollama
```
</details>

#### Model Not Found

**All Platforms:**
```bash
# List installed models
ollama list

# Pull required model
ollama pull llama3.2

# Verify model works
ollama run llama3.2 "Hello"
```

#### Connection Refused to Ollama

**All Platforms:**
```bash
# Check if Ollama is listening
curl http://localhost:11434/api/tags

# Or in browser: http://localhost:11434
```

**Windows alternative:**
```powershell
Invoke-WebRequest -Uri http://localhost:11434/api/tags
```

#### Python Virtual Environment Issues

<details>
<summary><b>macOS/Linux</b></summary>

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
</details>

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
cd medibot-backend\python\aiagent

# Remove old venv
Remove-Item -Recurse -Force venv

# Create new venv
python -m venv venv

# Activate (if execution policy error, see below)
.\venv\Scripts\Activate.ps1

# If you get execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Reinstall dependencies
pip install -r requirements.txt
```
</details>

---

### Web App Issues

#### Build Errors

**All Platforms:**
```bash
cd medibot-web

# Clear cache and reinstall
rm -rf node_modules package-lock.json .vite  # macOS/Linux
# Or
Remove-Item -Recurse -Force node_modules, package-lock.json, .vite  # Windows

npm install
npm run dev
```

#### API Connection Failed

1. **Check Backend is Running:**
   - macOS/Linux: `curl http://localhost:3001/api/health`
   - Windows: `Invoke-WebRequest http://localhost:3001/api/health`

2. **Verify `.env` file:**
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_AI_AGENT_URL=http://localhost:8000
   ```

3. **Restart Dev Server:**
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

---

### Mobile App Issues

#### Can't Connect to Backend

**Common Causes:**
1. **Using `localhost` instead of IP address**
   - ❌ Wrong: `http://localhost:3001`
   - ✅ Correct: `http://192.168.1.100:3001` (your computer's IP)

2. **Phone and computer on different WiFi networks**
   - Make sure both devices are on the same network

3. **Firewall blocking connections**
   - **macOS:** System Preferences → Security & Privacy → Firewall → Allow Node.js
   - **Windows:** Windows Defender Firewall → Allow an app → Add Node.js
   - **Linux:** `sudo ufw allow 3001` and `sudo ufw allow 8000`

#### Metro Bundler Errors

**All Platforms:**
```bash
# Clear Metro bundler cache
npm start -- --clear

# Or with Expo
expo start -c

# If that doesn't work, clear watchman (macOS/Linux)
watchman watch-del-all
```

#### Expo Go Connection Issues

1. **Try Tunnel Mode:**
   ```bash
   npm start -- --tunnel
   ```

2. **Check Expo CLI is up to date:**
   ```bash
   npm install -g expo-cli@latest
   ```

3. **Restart Everything:**
   - Close Expo Go app
   - Stop Metro bundler (Ctrl+C)
   - Run `npm start` again
   - Reopen Expo Go

---

### Docker Issues

#### Port Conflicts

**All Platforms:**
```bash
# Stop all Docker containers
docker-compose down

# Check for processes using ports
# macOS/Linux:
lsof -i:3001
lsof -i:8000

# Windows:
netstat -ano | findstr :3001
netstat -ano | findstr :8000
```

#### Build Failures

**All Platforms:**
```bash
# Clean build
docker-compose down -v  # Remove volumes
docker-compose build --no-cache
docker-compose up
```

#### Container Won't Start

```bash
# View logs
docker-compose logs backend
docker-compose logs aiagent
docker-compose logs web

# Restart specific service
docker-compose restart backend
```

---

### Still Having Issues?

1. **Check Prerequisites Again:**
   - Verify all required software is installed and running
   - Check versions match requirements

2. **Review Logs:**
   - Backend: Check terminal output
   - AI Agent: Check terminal output
   - Docker: `docker-compose logs -f`

3. **Try Docker Method:**
   - If local setup is problematic, use Docker Compose
   - It handles all dependencies automatically

4. **Get Help:**
   - Create an issue: https://github.com/NoelKhan/medibot-backend/issues
   - Include:
     - Your OS and version
     - Error messages
     - Steps you've already tried

---

## 📁 Project Structure

```
Medibot-MBSE/
├── medibot-backend/           # NestJS Backend
│   ├── src/                   # API source code
│   ├── migrations/            # Database migrations
│   └── python/aiagent/        # AI Agent (FastAPI)
├── medibot-web/               # React Web Dashboard
│   └── src/
│       ├── pages/             # Page components
│       ├── components/        # Reusable components
│       └── services/          # API services
├── medibot-mobile/            # React Native Mobile
│   └── src/
│       ├── screens/           # Screen components
│       └── services/          # API services
├── infrastructure/
│   ├── docker/                # Docker Compose
│   └── k8s/                   # Kubernetes manifests
├── scripts/                   # Automation scripts
│   ├── backend/
│   ├── web/
│   ├── mobile/
│   ├── deployment/
│   ├── development/
│   ├── testing/
│   └── utilities/
└── .github/workflows/         # CI/CD pipelines
```

---

## 🚀 What's Next?

1. **Explore Features**
   - Chat with AI assistant
   - Create appointments
   - Manage patient records
   - View analytics

2. **Customize**
   - Modify AI prompts: `medibot-backend/python/aiagent/prompts/`
   - Update UI themes
   - Add custom features

3. **Deploy to Cloud**
   - Use Docker Compose for simple deployments
   - Use Kubernetes for production scale
   - Enable CI/CD for automated deployments

4. **Scale**
   - Kubernetes HPA included
   - Add monitoring/logging
   - Configure SSL certificates

---

---

## � Quick Reference

### Essential Commands by Platform

#### Start All Services

<details>
<summary><b>macOS/Linux (Automated)</b></summary>

```bash
cd /path/to/Medibot-MBSE
./scripts/development/start-all-services.sh
```
</details>

<details>
<summary><b>Windows or All Platforms (Docker)</b></summary>

```bash
cd infrastructure/docker
docker-compose up -d
```
</details>

<details>
<summary><b>Manual Start (All Platforms)</b></summary>

**Terminal 1 - Backend:**
```bash
cd medibot-backend
npm run start:dev
```

**Terminal 2 - AI Agent:**
```bash
cd medibot-backend/python/aiagent

# macOS/Linux
source venv/bin/activate

# Windows
.\venv\Scripts\Activate.ps1

# Then (all platforms)
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Web (Optional):**
```bash
cd medibot-web
npm run dev
```

**Terminal 4 - Mobile (Optional):**
```bash
cd medibot-mobile
npm start
```
</details>

---

#### Check Service Status

**macOS/Linux:**
```bash
# Check if running
lsof -i:3001  # Backend
lsof -i:8000  # AI Agent
lsof -i:5173  # Web

# Health checks
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

**Windows (PowerShell):**
```powershell
# Check if running
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :8000  # AI Agent
netstat -ano | findstr :5173  # Web

# Health checks
Invoke-WebRequest -Uri http://localhost:3001/api/health
Invoke-WebRequest -Uri http://localhost:8000/health
```

**Docker:**
```bash
docker-compose ps
docker-compose logs -f
```

---

#### Stop All Services

**macOS/Linux (Automated):**
```bash
./scripts/development/stop-all.sh
```

**Windows or All Platforms (Docker):**
```bash
cd infrastructure/docker
docker-compose down
```

**Manual (All Platforms):**
- Press `Ctrl+C` in each terminal window running a service

---

#### Environment Files Quick Setup

**macOS/Linux:**
```bash
# Backend
cd medibot-backend && cp .env.example .env

# AI Agent
cd python/aiagent && cp .env.example .env

# Web
cd ../../medibot-web && cp .env.example .env

# Mobile
cd ../medibot-mobile && cp .env.example .env
```

**Windows (PowerShell):**
```powershell
# Backend
cd medibot-backend; copy .env.example .env

# AI Agent
cd python\aiagent; copy .env.example .env

# Web
cd ..\..\medibot-web; copy .env.example .env

# Mobile
cd ..\medibot-mobile; copy .env.example .env
```

---

#### Install All Dependencies

**macOS/Linux:**
```bash
# Backend
cd medibot-backend && npm install

# AI Agent
cd python/aiagent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Web
cd ../../medibot-web && npm install

# Mobile
cd ../medibot-mobile && npm install
```

**Windows (PowerShell):**
```powershell
# Backend
cd medibot-backend; npm install

# AI Agent
cd python\aiagent
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Web
cd ..\..\medibot-web; npm install

# Mobile
cd ..\medibot-mobile; npm install
```

---

#### Reset Everything (Clean Start)

**macOS/Linux:**
```bash
# Stop all services
./scripts/development/stop-all.sh

# Remove node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove Python venv
rm -rf medibot-backend/python/aiagent/venv

# Reinstall
cd medibot-backend && npm install
cd python/aiagent && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
cd ../../medibot-web && npm install
cd ../medibot-mobile && npm install
```

**Windows (PowerShell):**
```powershell
# Stop services (Ctrl+C in each terminal)

# Remove dependencies
Get-ChildItem -Path . -Include node_modules -Recurse -Force | Remove-Item -Recurse -Force
Remove-Item -Recurse -Force medibot-backend\python\aiagent\venv

# Reinstall
cd medibot-backend; npm install
cd python\aiagent; python -m venv venv; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt
cd ..\..\medibot-web; npm install
cd ..\medibot-mobile; npm install
```

**Docker (All Platforms):**
```bash
cd infrastructure/docker
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

#### Common URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:3001/api | Main API endpoints |
| Backend Health | http://localhost:3001/api/health | Backend status check |
| AI Agent | http://localhost:8000 | AI agent API |
| AI Agent Health | http://localhost:8000/health | AI agent status |
| AI Docs | http://localhost:8000/docs | FastAPI documentation |
| Web App | http://localhost:5173 | Web dashboard (dev) |
| Web App (Docker) | http://localhost:3000 | Web dashboard (production) |
| Ollama API | http://localhost:11434 | Ollama API |

---

#### Default Credentials

**Web Dashboard:**
- Email: `admin@medibot.com`
- Password: `admin123`

**PostgreSQL (local):**
- Username: `postgres`
- Password: (set during installation)
- Database: `medibot_db`
- Port: `5432`

**Redis (local):**
- Host: `localhost`
- Port: `6379`
- Password: (none for local)

---

## 📞 Support & Contributing

### Getting Help

1. **Check Troubleshooting Section** above first
2. **Search existing issues:** https://github.com/NoelKhan/medibot-backend/issues
3. **Create new issue** if problem persists
4. **Join discussions:** https://github.com/NoelKhan/medibot-backend/discussions

### When Reporting Issues

Please include:
- **OS and version** (e.g., Windows 11, macOS 14, Ubuntu 22.04)
- **Node.js version:** `node --version`
- **Python version:** `python --version` or `python3 --version`
- **Error messages** (full error text)
- **Steps to reproduce**
- **What you've already tried** from troubleshooting

### Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🎯 What's Next?

### For Developers

1. **Explore the Code:**
   - Backend: `medibot-backend/src/`
   - AI Agent: `medibot-backend/python/aiagent/`
   - Web: `medibot-web/src/`
   - Mobile: `medibot-mobile/src/`

2. **Customize Features:**
   - Modify AI prompts: `medibot-backend/python/aiagent/prompts/`
   - Update themes: `medibot-web/src/theme/` or `medibot-mobile/src/theme/`
   - Add new API endpoints: `medibot-backend/src/modules/`

3. **Run Tests:**
   ```bash
   npm test  # In any component folder
   ```

### For Deployment

1. **Development:** Use Docker Compose
2. **Staging/Production:** Use Kubernetes
3. **CI/CD:** GitHub Actions configured (see `.github/workflows/`)

### For Scaling

1. **Horizontal Pod Autoscaling:** Already configured in `infrastructure/k8s/hpa.yaml`
2. **Database Replication:** Configure PostgreSQL primary-replica
3. **Caching:** Redis configured for session and data caching
4. **Load Balancing:** Kubernetes ingress with multiple replicas

---

**Built with ❤️ for better healthcare access**

