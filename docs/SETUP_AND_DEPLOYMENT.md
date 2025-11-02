# MediBot MBSE - Complete Setup & Deployment Guide

**Version:** 1.0.0  
**Last Updated:** November 2, 2025

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Quick Start (Development)](#quick-start-development)
5. [Individual Service Setup](#individual-service-setup)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment (Kubernetes)](#cloud-deployment-kubernetes)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Environment Configuration](#environment-configuration)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

MediBot MBSE is a comprehensive healthcare management platform consisting of:

- **Backend API** (NestJS + PostgreSQL + TypeORM) - Port 3001
- **AI Agent** (Python FastAPI + Ollama) - Port 8000
- **Web Application** (React + Vite) - Port 3000
- **Mobile Application** (React Native + Expo)

---

## 📦 Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18.x or 20.x | Backend & Web runtime |
| **Python** | 3.9+ | AI Agent |
| **PostgreSQL** | 14+ | Database |
| **Redis** | 7+ | Caching |
| **Docker** | 24+ | Containerization |
| **Docker Compose** | 2.x | Multi-container orchestration |
| **kubectl** | Latest | Kubernetes deployment |

### Optional Tools

- **Bun** (for faster web development)
- **Expo CLI** (for mobile development)
- **Ollama** (for local LLM testing)

---

## 📁 Project Structure

```
Medibot-MBSE/
├── .github/workflows/          # CI/CD pipelines
│   ├── backend-cicd.yml       # Backend deployment
│   ├── ai-agent-cicd.yml      # AI agent deployment
│   ├── web-cicd.yml           # Web app deployment
│   └── mobile-cicd.yml        # Mobile app deployment
├── infrastructure/            # Infrastructure as Code
│   ├── docker/               # Docker configurations
│   │   └── docker-compose.yml
│   └── k8s/                  # Kubernetes manifests
│       ├── backend-deployment.yaml
│       ├── ai-agent-deployment.yaml
│       ├── web-deployment.yaml
│       └── mobile-deployment.yaml
├── scripts/                  # Automation scripts
│   ├── development/         # Development scripts
│   │   ├── start-all.sh    # Start all services
│   │   ├── stop-all.sh     # Stop all services
│   │   └── install-dependencies.sh
│   ├── deployment/          # Deployment scripts
│   │   ├── deploy.sh       # General deployment
│   │   ├── deploy-k8s.sh   # Kubernetes deployment
│   │   └── deploy-production.sh
│   └── utilities/           # Utility scripts
├── medibot-backend/         # Backend API service
│   ├── src/                # Source code
│   ├── python/aiagent/     # AI Agent (Python)
│   ├── infrastructure/     # Backend-specific infra
│   └── package.json
├── medibot-web/            # Web frontend
│   ├── src/
│   │   └── lib/shared/     # Shared API services & types
│   ├── infrastructure/
│   └── package.json
├── medibot-mobile/         # Mobile app
│   ├── src/
│   ├── infrastructure/
│   └── package.json
└── tests/                  # Integration tests
```

---

## 🚀 Quick Start (Development)

### Option 1: Automated Startup (All Services)

```bash
# Clone the repository
git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE
cd Medibot-MBSE

# Run the all-in-one startup script
chmod +x scripts/development/start-all.sh
./scripts/development/start-all.sh
```

This script will:
1. Start PostgreSQL and Redis via Docker
2. Start Backend API (port 3001)
3. Start AI Agent (port 8000)
4. Start Web App (port 3000)
5. Optionally start Mobile App

### Option 2: Manual Startup (Step by Step)

Follow the [Individual Service Setup](#individual-service-setup) section below.

---

## 🔧 Individual Service Setup

### 1. Backend API Setup

**Terminal 1: Backend**

```bash
cd medibot-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL and Redis (if using Docker)
docker-compose up -d postgres redis

# Wait for database to be ready (10 seconds)
sleep 10

# Run database migrations
npm run migration:run

# Seed database (optional)
npm run seed:dev

# Start backend in development mode
npm run start:dev
```

**Backend will be available at:** `http://localhost:3001`  
**API Documentation:** `http://localhost:3001/api/docs`

**Environment Variables:**

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=medibot_user
DATABASE_PASSWORD=medibot_password
DATABASE_NAME=medibot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=7d

# AI Agent
AI_AGENT_URL=http://localhost:8000

# Server
PORT=3001
NODE_ENV=development
```

---

### 2. AI Agent Setup

**Terminal 2: AI Agent**

```bash
cd medibot-backend/python/aiagent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r api/requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start Ollama (if using local LLM)
# In a separate terminal:
ollama serve

# Pull medical model (optional)
ollama pull llama2:7b

# Start AI Agent
cd api
python main.py
```

**AI Agent will be available at:** `http://localhost:8000`  
**API Documentation:** `http://localhost:8000/docs`

**Environment Variables:**

```env
# AI Agent Configuration
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=llama2:7b
MAX_TOKENS=500
TEMPERATURE=0.7

# Backend Integration
BACKEND_URL=http://localhost:3001
API_KEY=your-api-key-here

# Server
PORT=8000
HOST=0.0.0.0
```

**Alternative: Start with Backend Script**

```bash
cd medibot-backend
npm run start:with-python
```

---

### 3. Web Application Setup

**Terminal 3: Web**

```bash
cd medibot-web

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
# OR with Bun (faster)
bun run dev
```

**Web app will be available at:** `http://localhost:3000`

**Environment Variables (.env.local):**

```env
VITE_API_URL=http://localhost:3001
VITE_AI_AGENT_URL=http://localhost:8000
VITE_APP_NAME=MediBot
VITE_APP_VERSION=1.0.0
```

---

### 4. Mobile Application Setup

**Terminal 4: Mobile**

```bash
cd medibot-mobile

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start Expo development server
npm start

# Then choose platform:
# - Press 'a' for Android
# - Press 'i' for iOS (Mac only)
# - Press 'w' for web
```

**Environment Variables:**

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_AI_AGENT_URL=http://localhost:8000
```

**For Physical Device Testing:**

Replace `localhost` with your machine's local IP address (e.g., `192.168.1.100`).

---

## 🐳 Docker Deployment

### Full Stack with Docker Compose

```bash
cd infrastructure/docker

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Services:**

- Backend API: `http://localhost:3001`
- AI Agent: `http://localhost:8000`
- Web App: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Build Individual Images

```bash
# Backend
cd medibot-backend
docker build -t medibot-backend:latest -f infrastructure/Docker/Dockerfile .

# AI Agent
cd medibot-backend/python/aiagent
docker build -t medibot-ai-agent:latest .

# Web
cd medibot-web
docker build -t medibot-web:latest -f infrastructure/Dockerfile .

# Mobile (for build only)
cd medibot-mobile
docker build -t medibot-mobile:latest -f infrastructure/Docker/Dockerfile .
```

---

## ☸️ Cloud Deployment (Kubernetes)

### Prerequisites

1. Kubernetes cluster (EKS, GKE, AKS, or local Minikube)
2. kubectl configured
3. Docker images pushed to registry

### Deploy to Kubernetes

```bash
cd infrastructure/k8s

# Create namespace
kubectl create namespace medibot

# Deploy PostgreSQL (StatefulSet)
kubectl apply -f postgres-statefulset.yaml -n medibot

# Deploy Redis
kubectl apply -f redis-deployment.yaml -n medibot

# Deploy Backend
kubectl apply -f backend-deployment.yaml -n medibot

# Deploy AI Agent
kubectl apply -f ai-agent-deployment.yaml -n medibot

# Deploy Web App
kubectl apply -f web-deployment.yaml -n medibot

# Deploy Ingress
kubectl apply -f ingress.yaml -n medibot

# Setup Horizontal Pod Autoscaling
kubectl apply -f hpa.yaml -n medibot

# Check deployment status
kubectl get pods -n medibot
kubectl get services -n medibot
```

### Automated Deployment Script

```bash
cd infrastructure/k8s
chmod +x deploy.sh
./deploy.sh
```

### Environment Configuration

Create Kubernetes secrets:

```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=username=medibot_user \
  --from-literal=password=medibot_password \
  --from-literal=database=medibot \
  -n medibot

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret-key \
  -n medibot

# AI Agent credentials
kubectl create secret generic ai-agent-secret \
  --from-literal=api-key=your-api-key \
  -n medibot
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

The project uses GitHub Actions for automated CI/CD:

#### 1. Backend CI/CD (`.github/workflows/backend-cicd.yml`)

**Triggers:**
- Push to `main`, `develop` branches
- Changes in `medibot-backend/**`

**Jobs:**
1. **Lint & Test** - ESLint, TypeScript checks, unit tests
2. **Build Docker Image** - Build and push to registry
3. **Deploy** - Deploy to staging/production

#### 2. AI Agent CI/CD (`.github/workflows/ai-agent-cicd.yml`)

**Triggers:**
- Push to `main`, `develop` branches
- Changes in `medibot-backend/python/aiagent/**`

**Jobs:**
1. **Lint & Test** - Black, flake8, mypy, pytest
2. **Build Docker Image** - Build and push to registry
3. **Deploy** - Deploy alongside backend

#### 3. Web CI/CD (`.github/workflows/web-cicd.yml`)

**Triggers:**
- Push to `main`, `develop`, `staging` branches
- Changes in `medibot-web/**`

**Jobs:**
1. **Build & Test** - Lint, type check, build
2. **Build Docker Image** - Build and push to registry
3. **Deploy** - Deploy to CDN/hosting

#### 4. Mobile CI/CD (`.github/workflows/mobile-cicd.yml`)

**Triggers:**
- Push to `main`, `develop` branches
- Changes in `medibot-mobile/**`

**Jobs:**
1. **Lint & Test** - ESLint, TypeScript, Jest tests
2. **Build** - EAS Build for iOS/Android
3. **Deploy** - Submit to App Store/Play Store

### Build Order

The CI/CD pipeline executes in the following order:

```
1. Backend (with AI Agent) → Build & Test in parallel
2. Web → Depends on backend being ready
3. Mobile → Depends on backend and web being ready
```

### Setup GitHub Secrets

Required secrets for CI/CD:

```bash
# Docker Registry
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
# OR
GITHUB_TOKEN (automatic)

# AWS (if using EKS)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION

# Database
DATABASE_URL

# JWT
JWT_SECRET

# Expo (for mobile builds)
EXPO_TOKEN

# Kubernetes (if deploying to K8s)
KUBECONFIG
```

---

## ⚙️ Environment Configuration

### Development

Create `.env` files in each service directory:

```bash
# Root level
cp .env.example .env

# Backend
cp medibot-backend/.env.example medibot-backend/.env

# AI Agent
cp medibot-backend/python/aiagent/.env.example medibot-backend/python/aiagent/.env

# Web
cp medibot-web/.env.example medibot-web/.env.local

# Mobile
cp medibot-mobile/.env.example medibot-mobile/.env
```

### Production

Use environment-specific configuration:

- **Staging:** `.env.staging`
- **Production:** `.env.production`

**Never commit `.env` files to version control!**

---

## 🔍 Troubleshooting

### Backend Issues

**Problem:** Database connection refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
docker exec medibot-postgres pg_isready -U medibot

# View logs
docker logs medibot-postgres
```

**Problem:** Port 3001 already in use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### AI Agent Issues

**Problem:** Ollama not found

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve

# Pull model
ollama pull llama2:7b
```

**Problem:** Python dependencies issues

```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Web App Issues

**Problem:** CORS errors

- Ensure backend `CORS_ORIGINS` includes web app URL
- Check `medibot-backend/.env`:
  ```env
  CORS_ORIGINS=http://localhost:3000,http://localhost:5173
  ```

**Problem:** API calls failing

- Verify `VITE_API_URL` in `.env.local`
- Check backend is running: `curl http://localhost:3001/api/health`

### Mobile App Issues

**Problem:** Can't connect to backend from device

```bash
# Get your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update .env with your IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

**Problem:** Metro bundler issues

```bash
# Clear cache
npx expo start -c

# Reset node modules
rm -rf node_modules
npm install
```

### Docker Issues

**Problem:** Services won't start

```bash
# Check Docker daemon
docker info

# Restart Docker
# Mac: Restart Docker Desktop
# Linux: sudo systemctl restart docker

# Clean Docker system
docker system prune -a
```

**Problem:** Build failures

```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache
```

---

## 📊 Service Healthchecks

### Backend

```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### AI Agent

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

### Web

```bash
curl http://localhost:3000
# Expected: HTML response
```

### Database

```bash
docker exec medibot-postgres pg_isready -U medibot
# Expected: medibot-postgres:5432 - accepting connections
```

---

## 🎯 Development Workflow

### 1. Start Development Environment

```bash
# Terminal 1: Backend + AI Agent
cd medibot-backend
npm run start:dev

# Terminal 2: Web
cd medibot-web
npm run dev

# Terminal 3: Mobile (optional)
cd medibot-mobile
npm start
```

### 2. Make Changes

- Edit files in `src/` directories
- Changes will hot-reload automatically

### 3. Test

```bash
# Backend tests
cd medibot-backend
npm test
npm run test:e2e

# Web tests
cd medibot-web
npm test

# Mobile tests
cd medibot-mobile
npm test
```

### 4. Commit & Push

```bash
git add .
git commit -m "feat: your feature description"
git push origin your-branch
```

CI/CD will automatically:
- Run linting and tests
- Build Docker images
- Deploy to staging (on develop branch)
- Deploy to production (on main branch)

---

## 🎉 Success!

If all services are running, you should see:

- ✅ Backend API at `http://localhost:3001`
- ✅ AI Agent at `http://localhost:8000`
- ✅ Web App at `http://localhost:3000`
- ✅ Mobile App in Expo Go

**Next Steps:**

1. Create admin user via backend API
2. Login to web application
3. Test AI agent integration
4. Deploy to staging/production

---

## 📞 Support

For issues and questions:

- **GitHub Issues:** [Create an issue](https://github.com/NoelKhan/medibot-backend/issues)
- **Documentation:** Check individual service README files
- **CI/CD:** Review GitHub Actions logs

---

## 📄 License

MIT License - See LICENSE file for details

---

**Happy Coding! 🚀**
