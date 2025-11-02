# Medibot MBSE - Deployment Guide

## 🎯 Overview

This guide explains how to download and run Medibot Docker images from GitHub Container Registry. All CI/CD pipelines are now configured to build and publish Docker artifacts automatically on every push to `main` or `develop` branches.

---

## 📦 Available Docker Images

All images are published to GitHub Container Registry (ghcr.io):

| Component | Image URL | Tags |
|-----------|-----------|------|
| Backend | `ghcr.io/noelkhan/medibot-backend` | `main`, `main-<sha>`, `develop` |
| Web Frontend | `ghcr.io/noelkhan/medibot-web` | `main`, `main-<sha>`, `develop` |
| AI Agent | `ghcr.io/noelkhan/medibot-ai-agent` | `main`, `main-<sha>`, `develop` |

---

## 🚀 Quick Start - Using Docker Images

### Option 1: Pull and Run Individual Images

#### 1. Backend API
```bash
# Pull the latest backend image
docker pull ghcr.io/noelkhan/medibot-backend:main

# Run the backend
docker run -d \
  --name medibot-backend \
  -p 3001:3001 \
  -e DATABASE_HOST=your-db-host \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USER=postgres \
  -e DATABASE_PASSWORD=your-password \
  -e DATABASE_NAME=medibot \
  -e JWT_SECRET=your-secret-key \
  -e REDIS_HOST=your-redis-host \
  -e REDIS_PORT=6379 \
  ghcr.io/noelkhan/medibot-backend:main
```

#### 2. AI Agent
```bash
# Pull the AI agent image
docker pull ghcr.io/noelkhan/medibot-ai-agent:main

# Run the AI agent
docker run -d \
  --name medibot-ai-agent \
  -p 8000:8000 \
  -e OLLAMA_HOST=http://your-ollama-host:11434 \
  ghcr.io/noelkhan/medibot-ai-agent:main
```

#### 3. Web Frontend
```bash
# Pull the web frontend image
docker pull ghcr.io/noelkhan/medibot-web:main

# Run the web frontend
docker run -d \
  --name medibot-web \
  -p 3000:80 \
  ghcr.io/noelkhan/medibot-web:main
```

---

### Option 2: Using Docker Compose (Recommended)

Create a `docker-compose.prod.yml` file in your deployment directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: medibot
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  backend:
    image: ghcr.io/noelkhan/medibot-backend:main
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: postgres
      DATABASE_PASSWORD: ${DB_PASSWORD}
      DATABASE_NAME: medibot
      JWT_SECRET: ${JWT_SECRET}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      AI_AGENT_URL: http://ai-agent:8000
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  ai-agent:
    image: ghcr.io/noelkhan/medibot-ai-agent:main
    depends_on:
      - ollama
    environment:
      OLLAMA_HOST: http://ollama:11434
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  web:
    image: ghcr.io/noelkhan/medibot-web:main
    depends_on:
      - backend
      - ai-agent
    ports:
      - "3000:80"

volumes:
  postgres_data:
  redis_data:
  ollama_data:
```

Create a `.env` file:
```bash
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_min_32_chars
```

Deploy the stack:
```bash
# Pull all images
docker-compose -f docker-compose.prod.yml pull

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

---

## 🔐 Authentication with GitHub Container Registry

If the images are private, you'll need to authenticate:

```bash
# Create a GitHub Personal Access Token with read:packages scope
# Then login:
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

---

## ☁️ Cloud Deployment Options

### AWS ECS/Fargate

1. **Push images to ECR** (optional):
```bash
# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker tag ghcr.io/noelkhan/medibot-backend:main YOUR_ECR_URL/medibot-backend:latest
docker push YOUR_ECR_URL/medibot-backend:latest
```

2. **Create ECS Task Definition**:
   - Use the task definition in `medibot-backend/ecs-task-definition.json`
   - Update image URIs to your ECR or ghcr.io images

3. **Deploy to ECS**:
```bash
aws ecs update-service --cluster medibot-cluster --service medibot-backend --force-new-deployment
```

### Google Cloud Run

```bash
# Deploy backend
gcloud run deploy medibot-backend \
  --image ghcr.io/noelkhan/medibot-backend:main \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_HOST=your-db,JWT_SECRET=your-secret

# Deploy AI agent
gcloud run deploy medibot-ai-agent \
  --image ghcr.io/noelkhan/medibot-ai-agent:main \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy web
gcloud run deploy medibot-web \
  --image ghcr.io/noelkhan/medibot-web:main \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Instances

```bash
# Create resource group
az group create --name medibot-rg --location eastus

# Deploy backend
az container create \
  --resource-group medibot-rg \
  --name medibot-backend \
  --image ghcr.io/noelkhan/medibot-backend:main \
  --dns-name-label medibot-backend \
  --ports 3001 \
  --environment-variables \
    DATABASE_HOST=your-db \
    JWT_SECRET=your-secret

# Deploy AI agent
az container create \
  --resource-group medibot-rg \
  --name medibot-ai-agent \
  --image ghcr.io/noelkhan/medibot-ai-agent:main \
  --dns-name-label medibot-ai-agent \
  --ports 8000

# Deploy web
az container create \
  --resource-group medibot-rg \
  --name medibot-web \
  --image ghcr.io/noelkhan/medibot-web:main \
  --dns-name-label medibot-web \
  --ports 80
```

### Kubernetes Deployment

Use the provided Kubernetes manifests in `infrastructure/k8s/`:

```bash
# Create namespace
kubectl create namespace medibot-prod

# Apply all manifests
kubectl apply -f infrastructure/k8s/ -n medibot-prod

# Check status
kubectl get pods -n medibot-prod
kubectl get services -n medibot-prod

# View logs
kubectl logs -f deployment/medibot-backend -n medibot-prod
```

---

## 📊 Monitoring Deployed Containers

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# AI Agent health
curl http://localhost:8000/health

# Web frontend
curl http://localhost:3000
```

### View Logs

```bash
# Docker logs
docker logs -f medibot-backend
docker logs -f medibot-ai-agent
docker logs -f medibot-web

# Docker Compose logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f ai-agent
docker-compose -f docker-compose.prod.yml logs -f web
```

### Container Stats

```bash
# View resource usage
docker stats medibot-backend medibot-ai-agent medibot-web
```

---

## 🔄 Updating to Latest Version

### Pull Latest Images

```bash
# Pull specific version
docker pull ghcr.io/noelkhan/medibot-backend:main

# Pull all images
docker-compose -f docker-compose.prod.yml pull

# Restart with new images
docker-compose -f docker-compose.prod.yml up -d
```

### Zero-Downtime Updates

```bash
# Scale up with new version
docker-compose -f docker-compose.prod.yml up -d --scale backend=2

# Wait for health checks to pass
sleep 30

# Scale down old version
docker-compose -f docker-compose.prod.yml up -d --scale backend=1
```

---

## 🛡️ Security Best Practices

1. **Use specific image tags** instead of `:main` in production
2. **Store secrets securely** using:
   - Docker secrets
   - Cloud provider secret managers (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
   - Kubernetes secrets
3. **Use private networks** for database and Redis connections
4. **Enable HTTPS** with reverse proxy (nginx, Traefik, or cloud load balancers)
5. **Set resource limits** in Docker Compose or Kubernetes
6. **Enable logging** and monitoring (Prometheus, Grafana, ELK stack)

---

## 📝 Image Versioning

All images are tagged with:
- **Branch name**: `main`, `develop`
- **Git SHA**: `main-abc1234` (for specific commits)

Example:
```bash
# Use specific commit SHA for reproducible deployments
docker pull ghcr.io/noelkhan/medibot-backend:main-cb50d50
```

---

## 🆘 Troubleshooting

### Can't pull images
```bash
# Check if you're authenticated
docker login ghcr.io

# Verify image exists
docker pull ghcr.io/noelkhan/medibot-backend:main
```

### Database connection errors
```bash
# Check database is accessible
docker exec -it medibot-backend nc -zv postgres 5432

# View backend logs
docker logs medibot-backend
```

### Redis connection errors
```bash
# Check Redis is running
docker exec -it medibot-backend nc -zv redis 6379
```

### Ollama not responding
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Pull required models
docker exec ollama ollama pull llama2
docker exec ollama ollama pull mistral
```

---

## 📚 Additional Resources

- **CI/CD Status**: Check GitHub Actions for build status
- **Docker Images**: View all images at https://github.com/NoelKhan/Medibot-MBSE/pkgs/container/
- **Kubernetes Manifests**: See `infrastructure/k8s/`
- **Local Development**: See platform-specific setup guides (SETUP-MACOS.md, SETUP-WINDOWS.md, SETUP-LINUX.md)

---

## 🎉 Success!

Once deployed, you should be able to access:
- **Backend API**: http://your-host:3001/api
- **AI Agent**: http://your-host:8000
- **Web Dashboard**: http://your-host:3000
- **API Documentation**: http://your-host:3001/api/docs

For questions or issues, check the troubleshooting guide or create an issue on GitHub.
