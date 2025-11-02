# 🏥 MediBot - AI-Powered Healthcare Platform

[![CI/CD](https://github.com/NoelKhan/medibot-backend/actions/workflows/complete-stack-cicd.yml/badge.svg)](https://github.com/NoelKhan/medibot-backend/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x%20|%2020.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)

**A complete healthcare management monorepo** featuring AI-powered medical assistance, patient records, appointment scheduling, and telemedicine. Includes backend API, AI agent with LLM models, web dashboard, and mobile app.

---

## ⚡ Quick Start (5 Minutes)

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

**🎉 Done! Access your services:**
- 🌐 **Web Dashboard**: http://localhost:5173
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
  - [Docker (Recommended)](#docker-all-in-one)
  - [Kubernetes (Production)](#kubernetes-production)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Troubleshooting](#-troubleshooting)

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

**Required:**
- **Node.js** 18.x or 20.x - [Download](https://nodejs.org/)
- **Python** 3.11+ - [Download](https://www.python.org/)
- **PostgreSQL** 14+ - [Download](https://www.postgresql.org/download/)
- **Redis** 7+ - [Download](https://redis.io/download/)
- **Ollama** (for AI) - [Download](https://ollama.ai/download)

**Optional:**
- **Docker** & **Docker Compose** - [Download](https://www.docker.com/)
- **Expo CLI** (for mobile) - `npm install -g expo-cli`

**Verify installation:**
```bash
node --version    # v18.x or v20.x
python3 --version # 3.11+
psql --version    # 14+
redis-cli --version # 7+
curl http://localhost:11434/api/tags # Ollama running
```

---

## 🛠️ Installation Guide

### 1. Backend + Database

```bash
# Start PostgreSQL & Redis
brew services start postgresql@14
brew services start redis

# Create database
createdb medibot_db

# Install backend dependencies
cd medibot-backend
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings
```

**Required `.env` settings:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=medibot_db

REDIS_HOST=localhost
REDIS_PORT=6379

AI_AGENT_URL=http://localhost:8000
JWT_SECRET=your-super-secret-key

PORT=3001
NODE_ENV=development
```

**Start backend:**
```bash
npm run start:dev
```

**Test:**
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok",...}
```

---

### 2. AI Agent + LLM Models

#### Install Ollama

**macOS:**
```bash
brew install ollama
ollama serve
```

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

**Windows:** Download from https://ollama.ai/download

#### Choose Your AI Model

Pick based on your computer's RAM:

| Model | Size | RAM Needed | Best For | Install Command |
|-------|------|------------|----------|-----------------|
| **Llama 3.2** ⭐ | 2GB | 8GB | Fast, general purpose | `ollama pull llama3.2` |
| **MedLlama2** | 3.8GB | 8GB | Medical-specific | `ollama pull medllama2` |
| **Llama 2 (7B)** | 3.8GB | 8GB | Medical fine-tuning | `ollama pull llama2:7b` |
| **Llama 3.1** | 4.7GB | 16GB | Advanced | `ollama pull llama3.1` |
| **Mistral** | 4.1GB | 8GB | Fast & efficient | `ollama pull mistral` |

**Recommended:**
```bash
ollama pull llama3.2  # Best for most users
```

**Verify:**
```bash
ollama list
ollama run llama3.2 "What causes headaches?"
```

#### Setup AI Agent

```bash
cd medibot-backend/python/aiagent
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
nano .env  # Set OLLAMA_MODEL=llama3.2
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

**Start AI Agent:**
```bash
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Test:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","services":{...}}
```

---

### 3. Web Dashboard (Optional)

```bash
cd medibot-web
npm install

# Configure
cp .env.example .env
```

**Required `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_AGENT_URL=http://localhost:8000
```

**Start web app:**
```bash
npm run dev:node
```

**Access:** http://localhost:5173

**Default credentials:**
- Email: `admin@medibot.com`
- Password: `admin123`

---

### 4. Mobile App (Optional)

```bash
cd medibot-mobile
npm install
npm install -g expo-cli  # If not installed

# Configure
cp .env.example .env
```

**Required `.env`:**
```env
API_URL=http://YOUR_COMPUTER_IP:3001/api
AI_AGENT_URL=http://YOUR_COMPUTER_IP:8000
```

**Find your IP:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

**Start mobile app:**
```bash
npm start
```

**Test on device:**
1. Install **Expo Go** from App Store/Play Store
2. Scan QR code from terminal
3. App loads on your device

**Or use emulator:**
```bash
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS only)
```

---

## 🧪 Testing

### Quick Test All Services

```bash
# Automated health check
./scripts/utilities/check-services.sh

# Or manually
lsof -i:3001  # Backend
lsof -i:8000  # AI Agent
lsof -i:5173  # Web
```

### Test AI Integration

```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "I have a fever and cough"}'
```

Should return AI analysis with symptoms and recommendations.

### Run Test Suites

```bash
# All tests
./scripts/testing/test-all.sh

# Individual services
cd medibot-backend && npm test
cd medibot-web && npm test
cd medibot-mobile && npm test
```

---

## 🚀 Deployment

### Docker (All-in-One)

**Perfect for:** Testing, demos, simple deployments

```bash
cd infrastructure/docker

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access services:**
- Backend: http://localhost:3001
- AI Agent: http://localhost:8000
- Web: http://localhost:3000

### Kubernetes (Production)

**Perfect for:** Production, auto-scaling, high availability

```bash
cd infrastructure/k8s

# Create namespace
kubectl create namespace medibot-prod

# Create secrets
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres \
  --from-literal=password=your-password \
  -n medibot-prod

kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret \
  -n medibot-prod

# Deploy services
kubectl apply -f postgres-statefulset.yaml -n medibot-prod
kubectl apply -f ollama-statefulset.yaml -n medibot-prod
kubectl apply -f backend-deployment.yaml -n medibot-prod
kubectl apply -f ai-agent-deployment.yaml -n medibot-prod
kubectl apply -f web-deployment.yaml -n medibot-prod
kubectl apply -f ingress.yaml -n medibot-prod
kubectl apply -f hpa.yaml -n medibot-prod

# Check status
kubectl get pods -n medibot-prod
kubectl get svc -n medibot-prod
```

**Or use deploy script:**
```bash
./infrastructure/k8s/deploy.sh
```

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

### Backend Issues

**Port 3001 already in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Database connection failed:**
```bash
brew services start postgresql@14
psql -l | grep medibot_db
```

**Redis connection failed:**
```bash
brew services start redis
redis-cli ping  # Should return PONG
```

### AI Agent Issues

**Ollama not running:**
```bash
ollama serve
```

**Model not found:**
```bash
ollama list
ollama pull llama3.2
```

**Connection refused:**
```bash
curl http://localhost:11434/api/tags
# Should return JSON list of models
```

### Web App Issues

**Build errors:**
```bash
cd medibot-web
rm -rf node_modules package-lock.json
npm install
npm run dev:node  # Use node, not bun
```

**API connection failed:**
- Check `.env` has correct `VITE_API_URL`
- Verify backend is running: `curl http://localhost:3001/api/health`

### Mobile App Issues

**Can't connect to backend:**
- Use your computer's IP, not `localhost`
- Check firewall allows connections
- Verify API_URL in `.env` uses IP address

**Metro bundler errors:**
```bash
npm start -- --clear
# Or
expo start -c
```

### Docker Issues

**Port conflicts:**
```bash
docker-compose down
lsof -i:3001  # Check for conflicts
lsof -i:8000
```

**Build failures:**
```bash
docker-compose build --no-cache
docker-compose up --build
```

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

## 📞 Support & Contributing

- **Issues**: https://github.com/NoelKhan/medibot-backend/issues
- **Discussions**: https://github.com/NoelKhan/medibot-backend/discussions
- **License**: MIT - see [LICENSE](LICENSE)

---

**Built with ❤️ for better healthcare access**
