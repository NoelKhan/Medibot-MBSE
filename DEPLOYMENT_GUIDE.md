# MediBot Deployment Guide
**Complete Guide for Local Development, Cloud Deployment, and CI/CD Setup**

---

## Table of Contents
1. [Quick Start - Local Development](#quick-start---local-development)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Cloud Deployment Options](#cloud-deployment-options)
6. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start - Local Development

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Python**: 3.11+ (for AI agent)
- **PostgreSQL**: 14+ (or use Docker)
- **Redis**: 7+ (or use Docker)
- **Docker** (optional): For containerized development

### Option 1: Native Development (Recommended for Development)

#### 1. Clone and Setup
```bash
cd /Users/noelkhan/dev\ mbse/Medibot-MBSE

# Install all dependencies
cd medibot-backend && npm install
cd ../medibot-web && npm install
cd ../medibot-mobile && npm install
```

#### 2. Start Database Services
```bash
# Using Docker for databases only
docker run -d --name medibot-postgres \
  -e POSTGRES_DB=medibot \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:14-alpine

docker run -d --name medibot-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 3. Configure Environment Variables

**Backend** (`medibot-backend/.env`):
```env
NODE_ENV=development
PORT=3001

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=medibot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (still needed for protected endpoints)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# AI Agent
AI_AGENT_URL=http://localhost:8000

# CORS (allow web app)
CORS_ORIGIN=http://localhost:5173
```

**Web App** (`medibot-web/.env`):
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_ENV=development
```

**AI Agent** (`medibot-backend/python/aiagent/.env`):
```env
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=mistral:latest
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medibot
```

#### 4. Start All Services

**Terminal 1 - Backend:**
```bash
cd medibot-backend
npm run start:dev
# Backend runs on http://localhost:3001
```

**Terminal 2 - Web App:**
```bash
cd medibot-web
npm run dev
# Web app runs on http://localhost:5173
```

**Terminal 3 - AI Agent:**
```bash
cd medibot-backend/python/aiagent
python -m uvicorn main:app --reload --port 8000
# AI agent runs on http://localhost:8000
```

**Terminal 4 - Ollama (Optional for local AI):**
```bash
ollama serve
# Then pull model: ollama pull mistral:latest
```

#### 5. Verify Services

```bash
# Health checks
curl http://localhost:3001/health          # Backend
curl http://localhost:5173                 # Web (HTML response)
curl http://localhost:8000/health          # AI Agent

# Test anonymous chat (no authentication required)
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, I have a headache"}'
```

---

## Option 2: Full Docker Development

### Using Docker Compose (All Services)

```bash
cd infrastructure/docker

# Start all services (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Services Started:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Backend API: `localhost:3001`
- Web App: `localhost:3000` (production nginx)
- AI Agent: `localhost:8000`
- Ollama: `localhost:11434`

### Development with Docker (Hot Reload)

```bash
# Start only databases
docker-compose up -d postgres redis

# Run backend/web natively with hot reload
cd medibot-backend && npm run start:dev
cd medibot-web && npm run dev
```

---

## Environment Configuration

### Required Secrets for Production

Create these files (DO NOT commit to git):

**Backend Production** (`medibot-backend/.env.production`):
```env
NODE_ENV=production
PORT=3001

# Database (use managed service in production)
DATABASE_HOST=your-rds-endpoint.amazonaws.com
DATABASE_PORT=5432
DATABASE_USER=medibot_prod
DATABASE_PASSWORD=<STRONG_PASSWORD>
DATABASE_NAME=medibot_prod
DATABASE_SSL=true

# Redis (use managed service)
REDIS_HOST=your-redis-endpoint.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>
REDIS_TLS=true

# JWT
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_EXPIRATION=7d

# AI Agent
AI_AGENT_URL=https://ai-agent.yourdomain.com

# CORS
CORS_ORIGIN=https://medibot.yourdomain.com

# Monitoring
LOG_LEVEL=warn
```

**Generate Strong Secrets:**
```bash
# JWT Secret (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Database Password
openssl rand -base64 32
```

---

## Docker Deployment

### Build Docker Images

```bash
# From root directory
cd infrastructure/docker

# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build web
```

### Push to Container Registry

#### GitHub Container Registry (ghcr.io)
```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Tag images
docker tag medibot-backend ghcr.io/noelkhan/medibot-backend:latest
docker tag medibot-web ghcr.io/noelkhan/medibot-web:latest
docker tag medibot-ai-agent ghcr.io/noelkhan/medibot-ai-agent:latest

# Push images
docker push ghcr.io/noelkhan/medibot-backend:latest
docker push ghcr.io/noelkhan/medibot-web:latest
docker push ghcr.io/noelkhan/medibot-ai-agent:latest
```

#### Docker Hub
```bash
# Login
docker login

# Tag and push
docker tag medibot-backend noelkhan/medibot-backend:latest
docker push noelkhan/medibot-backend:latest
```

#### AWS ECR
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Create repositories (first time only)
aws ecr create-repository --repository-name medibot-backend
aws ecr create-repository --repository-name medibot-web
aws ecr create-repository --repository-name medibot-ai-agent

# Tag and push
docker tag medibot-backend YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/medibot-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/medibot-backend:latest
```

---

## Kubernetes Deployment

### Prerequisites
- **kubectl**: Kubernetes CLI installed
- **Cluster**: Access to a Kubernetes cluster (EKS, GKE, AKS, or local minikube)
- **Docker Images**: Pushed to a container registry

### Local Testing with Minikube

```bash
# Start minikube
minikube start --cpus=4 --memory=8192

# Enable ingress
minikube addons enable ingress

# Deploy
cd infrastructure/k8s
./deploy.sh

# Get service URL
minikube service web-service --url
```

### Production Kubernetes Deployment

#### 1. Update Image References

Edit deployment files to use your registry:

```bash
cd infrastructure/k8s

# Update backend-deployment.yaml
# Change image: medibot-backend:latest
# To: ghcr.io/noelkhan/medibot-backend:latest

# Update web-deployment.yaml
# Change image: medibot-web:latest
# To: ghcr.io/noelkhan/medibot-web:latest
```

#### 2. Create Namespace and Secrets

```bash
# Create namespace
kubectl create namespace medibot

# Create image pull secret (if using private registry)
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=$GITHUB_TOKEN \
  --namespace=medibot

# Create database secret
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres \
  --from-literal=password=YOUR_STRONG_PASSWORD \
  --namespace=medibot

# Create JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=$(openssl rand -base64 32) \
  --namespace=medibot

# Create backend env secret
kubectl create secret generic backend-env \
  --from-literal=DATABASE_HOST=postgres-service \
  --from-literal=DATABASE_PORT=5432 \
  --from-literal=DATABASE_NAME=medibot \
  --from-literal=REDIS_HOST=redis-service \
  --from-literal=REDIS_PORT=6379 \
  --from-literal=AI_AGENT_URL=http://ai-agent-service:8000 \
  --namespace=medibot
```

#### 3. Deploy Services

```bash
cd infrastructure/k8s

# Deploy PostgreSQL
kubectl apply -f postgres-statefulset.yaml -n medibot

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n medibot

# Deploy Backend
kubectl apply -f backend-deployment.yaml -n medibot

# Deploy Web Frontend
kubectl apply -f web-deployment.yaml -n medibot

# Deploy AI Agent
kubectl apply -f ai-agent-deployment.yaml -n medibot

# Deploy Ollama (optional)
kubectl apply -f ollama-statefulset.yaml -n medibot

# Deploy Ingress
kubectl apply -f ingress.yaml -n medibot

# Deploy HPA (Horizontal Pod Autoscaler)
kubectl apply -f hpa.yaml -n medibot
```

#### 4. Verify Deployment

```bash
# Check all resources
kubectl get all -n medibot

# Check pod status
kubectl get pods -n medibot

# View logs
kubectl logs -f deployment/backend -n medibot
kubectl logs -f deployment/web -n medibot

# Check ingress
kubectl get ingress -n medibot

# Port forward for testing (if ingress not ready)
kubectl port-forward svc/backend-service 3001:80 -n medibot
kubectl port-forward svc/web-service 3000:80 -n medibot
```

---

## Cloud Deployment Options

### Option 1: AWS (Amazon Web Services)

#### Architecture
- **EKS** (Elastic Kubernetes Service) for orchestration
- **RDS PostgreSQL** for database
- **ElastiCache Redis** for caching
- **Application Load Balancer** for ingress
- **ECR** for container registry
- **S3 + CloudFront** for web app (optional)

#### Setup Steps

**1. Create EKS Cluster:**
```bash
# Install eksctl
brew install eksctl  # macOS

# Create cluster (takes ~15 minutes)
eksctl create cluster \
  --name medibot-prod \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --name medibot-prod --region us-east-1
```

**2. Create RDS PostgreSQL:**
```bash
# Via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier medibot-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username medibot_admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name medibot-subnet-group \
  --backup-retention-period 7 \
  --multi-az
```

**3. Create ElastiCache Redis:**
```bash
aws elasticache create-replication-group \
  --replication-group-id medibot-redis \
  --replication-group-description "MediBot Cache" \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 2 \
  --automatic-failover-enabled
```

**4. Deploy to EKS:**
```bash
# Use the Kubernetes deployment steps above
# Update secrets with RDS/ElastiCache endpoints
kubectl create secret generic backend-env \
  --from-literal=DATABASE_HOST=medibot-prod.xxxxxxxxx.us-east-1.rds.amazonaws.com \
  --from-literal=REDIS_HOST=medibot-redis.xxxxxx.cache.amazonaws.com \
  --namespace=medibot
```

**5. Setup Load Balancer:**
```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

# Apply ingress with ALB annotations
kubectl apply -f ingress.yaml -n medibot
```

### Option 2: Google Cloud Platform (GCP)

#### Architecture
- **GKE** (Google Kubernetes Engine)
- **Cloud SQL for PostgreSQL**
- **Memorystore for Redis**
- **Cloud Load Balancing**
- **Artifact Registry**

#### Setup Steps

**1. Create GKE Cluster:**
```bash
gcloud container clusters create medibot-prod \
  --region=us-central1 \
  --num-nodes=2 \
  --machine-type=e2-medium \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5

# Get credentials
gcloud container clusters get-credentials medibot-prod --region=us-central1
```

**2. Create Cloud SQL:**
```bash
gcloud sql instances create medibot-prod \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create medibot --instance=medibot-prod
```

**3. Deploy:**
```bash
# Follow Kubernetes deployment steps
# Use Cloud SQL Proxy for database connection
```

### Option 3: Azure

#### Architecture
- **AKS** (Azure Kubernetes Service)
- **Azure Database for PostgreSQL**
- **Azure Cache for Redis**
- **Application Gateway**

#### Setup Steps

**1. Create Resource Group:**
```bash
az group create --name medibot-prod --location eastus
```

**2. Create AKS Cluster:**
```bash
az aks create \
  --resource-group medibot-prod \
  --name medibot-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

az aks get-credentials --resource-group medibot-prod --name medibot-cluster
```

**3. Create PostgreSQL:**
```bash
az postgres server create \
  --resource-group medibot-prod \
  --name medibot-db \
  --location eastus \
  --admin-user medibot_admin \
  --admin-password YOUR_PASSWORD \
  --sku-name B_Gen5_1
```

### Option 4: Digital Ocean (Cost-Effective)

```bash
# Create Kubernetes cluster via DO Console or CLI
doctl kubernetes cluster create medibot-prod \
  --region nyc1 \
  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=3"

# Create managed PostgreSQL
doctl databases create medibot-db --engine pg --region nyc1

# Follow Kubernetes deployment steps
```

### Option 5: Render.com (Simplest)

**No Kubernetes Required - PaaS Deployment**

1. Create account at render.com
2. Connect GitHub repository
3. Create services:
   - **Web Service** (medibot-backend): Auto-deploy from `medibot-backend/`
   - **Static Site** (medibot-web): Auto-deploy from `medibot-web/`
   - **PostgreSQL Database**: Managed database
   - **Redis**: Managed Redis

Render automatically handles:
- SSL certificates
- Container builds
- Auto-scaling
- Health checks
- Rollbacks

---

## CI/CD Pipeline Setup

### GitHub Actions (Recommended)

#### Prerequisites

**1. Create GitHub Secrets:**

Go to: `Settings > Secrets and variables > Actions > New repository secret`

```
Required Secrets:
- DOCKER_USERNAME          # Docker Hub or ghcr.io username
- DOCKER_PASSWORD          # Docker Hub password or GitHub token
- KUBECONFIG              # Base64 encoded kubeconfig file
- DATABASE_PASSWORD       # Production database password
- JWT_SECRET              # Production JWT secret
- VITE_API_URL_PROD       # Production API URL (https://api.yourdomain.com)

Optional (for AWS):
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_ACCOUNT_ID

Optional (for GCP):
- GCP_PROJECT_ID
- GCP_SERVICE_ACCOUNT_KEY

Optional (for notifications):
- SLACK_WEBHOOK_URL
- DISCORD_WEBHOOK_URL
```

**2. Encode Kubeconfig:**
```bash
# Get your kubeconfig
cat ~/.kube/config | base64 | pbcopy  # macOS
cat ~/.kube/config | base64 -w 0      # Linux
```

#### Existing CI/CD Workflows

You already have 5 workflows configured:

**1. Complete Stack CI/CD** (`.github/workflows/complete-stack-cicd.yml`)
- **Triggers**: Push to main/develop, manual dispatch
- **Jobs**: Backend build/test, AI agent build/test, Web build, Docker images, K8s deploy
- **Status**: ✅ Ready (needs secrets configured)

**2. Backend CI/CD** (`.github/workflows/backend-cicd.yml`)
- **Triggers**: Push to medibot-backend/
- **Jobs**: Lint, type check, unit tests, integration tests, Docker build
- **Status**: ⚠️ Needs secrets (DATABASE_PASSWORD, JWT_SECRET)

**3. Web CI/CD** (`.github/workflows/web-cicd.yml`)
- **Triggers**: Push to medibot-web/
- **Jobs**: Lint, build, Docker build, deploy to Vercel/Netlify
- **Status**: ⚠️ Needs secrets (VITE_API_URL_PROD)

**4. AI Agent CI/CD** (`.github/workflows/ai-agent-cicd.yml`)
- **Triggers**: Push to python/aiagent/
- **Jobs**: Lint, type check, tests, Docker build
- **Status**: ✅ Ready (minimal secrets)

**5. Mobile CI/CD** (`.github/workflows/mobile-cicd.yml`)
- **Triggers**: Push to medibot-mobile/
- **Jobs**: Lint, type check, Expo build
- **Status**: ⚠️ Needs Expo token

#### Configure Secrets Now

```bash
# Go to your repository on GitHub
# Navigate to: Settings > Secrets and variables > Actions

# Add these secrets (minimum required for testing):

# 1. Docker Registry (use GitHub's built-in)
GITHUB_TOKEN  # Already available, no need to add

# 2. Database (for tests)
DATABASE_PASSWORD: "test-password-change-in-prod"

# 3. JWT (for tests)
JWT_SECRET: $(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 4. Web API URL
VITE_API_URL_PROD: "https://api.yourdomain.com"  # Or your actual domain

# 5. Kubernetes (optional, for deployment)
KUBECONFIG: <base64_encoded_kubeconfig>
```

#### Test CI/CD Pipeline

```bash
# Make a small change
echo "# Test CI/CD" >> README.md

# Commit and push
git add README.md
git commit -m "test: Trigger CI/CD pipeline"
git push origin main

# Watch workflow
# Go to: https://github.com/NoelKhan/medibot-web/actions
```

#### Expected Results

✅ **Backend Pipeline:**
- Lint: Pass
- Type Check: Pass (compiles in ~2.8s)
- Unit Tests: Pass (with test database)
- Docker Build: Success
- Push to ghcr.io: Success

✅ **Web Pipeline:**
- Lint: Pass
- Type Check: Pass
- Build: Success (builds in ~4.25s)
- Docker Build: Success
- Push to ghcr.io: Success

✅ **Complete Stack:**
- All services build successfully
- Docker images pushed
- Kubernetes deployment (if KUBECONFIG provided)

#### Manual Workflow Trigger

```bash
# Trigger complete stack deployment manually
gh workflow run complete-stack-cicd.yml \
  --ref main \
  -f environment=staging
```

### Alternative CI/CD Platforms

#### GitLab CI/CD

Create `.gitlab-ci.yml`:
```yaml
stages:
  - test
  - build
  - deploy

backend-test:
  stage: test
  image: node:20
  services:
    - postgres:14
  script:
    - cd medibot-backend
    - npm ci
    - npm run test:cov

backend-build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA -f infrastructure/docker/backend/Dockerfile .
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA
```

#### Jenkins

Create `Jenkinsfile`:
```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'cd medibot-backend && npm ci && npm test'
            }
        }
        stage('Build') {
            steps {
                sh 'docker build -t medibot-backend -f infrastructure/docker/backend/Dockerfile .'
            }
        }
        stage('Deploy') {
            steps {
                sh 'kubectl apply -f infrastructure/k8s/'
            }
        }
    }
}
```

---

## Deployment Checklist

### Before First Production Deployment

- [ ] **Environment Variables**
  - [ ] All secrets generated with strong random values
  - [ ] Production database credentials configured
  - [ ] JWT secret generated (256-bit minimum)
  - [ ] CORS origins whitelisted
  - [ ] API URLs updated

- [ ] **Database**
  - [ ] Managed database service provisioned (RDS, Cloud SQL, etc.)
  - [ ] SSL/TLS enabled
  - [ ] Automated backups configured (7-30 days retention)
  - [ ] Connection pooling configured
  - [ ] Run migrations: `npm run migration:run`

- [ ] **Security**
  - [ ] Secrets stored in secret manager (not in code)
  - [ ] Network policies configured (K8s)
  - [ ] Security groups/firewall rules configured
  - [ ] HTTPS/TLS certificates installed
  - [ ] Rate limiting enabled
  - [ ] API keys rotated from defaults

- [ ] **Monitoring**
  - [ ] Health check endpoints tested
  - [ ] Logging configured (CloudWatch, Stackdriver, etc.)
  - [ ] Alerts configured (downtime, high CPU, errors)
  - [ ] APM tool integrated (optional: New Relic, Datadog)

- [ ] **CI/CD**
  - [ ] All GitHub secrets configured
  - [ ] Workflows tested on staging branch
  - [ ] Rollback procedure documented
  - [ ] Blue-green or canary deployment strategy

- [ ] **Testing**
  - [ ] All tests passing locally
  - [ ] Integration tests passing
  - [ ] Load testing performed
  - [ ] Anonymous chat tested
  - [ ] Mobile app authentication tested

---

## Troubleshooting

### Local Development Issues

**Issue: Port already in use**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9   # Backend
lsof -ti:5173 | xargs kill -9   # Web
lsof -ti:8000 | xargs kill -9   # AI Agent
```

**Issue: Database connection refused**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker restart medibot-postgres

# Check logs
docker logs medibot-postgres
```

**Issue: npm install fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Docker Issues

**Issue: Build fails with context error**
```bash
# Ensure building from root directory
cd /Users/noelkhan/dev\ mbse/Medibot-MBSE
docker-compose -f infrastructure/docker/docker-compose.yml build
```

**Issue: Container exits immediately**
```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker-compose config
```

### Kubernetes Issues

**Issue: Pods in CrashLoopBackOff**
```bash
# Check pod logs
kubectl logs -f pod/backend-xxxxx -n medibot

# Describe pod for events
kubectl describe pod backend-xxxxx -n medibot

# Check secrets exist
kubectl get secrets -n medibot
```

**Issue: Service not accessible**
```bash
# Check service
kubectl get svc -n medibot

# Port forward for testing
kubectl port-forward svc/backend-service 3001:80 -n medibot

# Check ingress
kubectl describe ingress -n medibot
```

### CI/CD Issues

**Issue: Workflow fails with missing secrets**
```bash
# Go to GitHub: Settings > Secrets > Actions
# Ensure all required secrets are added
# Re-run workflow
```

**Issue: Docker push unauthorized**
```bash
# Check GITHUB_TOKEN permissions
# Settings > Actions > General > Workflow permissions
# Select: Read and write permissions
```

**Issue: Tests fail in CI but pass locally**
```bash
# Check GitHub Actions logs
# Common issues:
# - Different Node.js version
# - Missing environment variables
# - Database connection issues
```

---

## Next Steps

### Immediate Actions (Required for CI/CD)

1. **Configure GitHub Secrets** (5 minutes)
   ```bash
   # Go to: https://github.com/NoelKhan/medibot-web/settings/secrets/actions
   # Add: JWT_SECRET, DATABASE_PASSWORD, VITE_API_URL_PROD
   ```

2. **Push Code to Trigger Pipeline** (1 minute)
   ```bash
   git add .
   git commit -m "chore: Configure deployment pipeline"
   git push origin main
   ```

3. **Monitor First Build** (5-10 minutes)
   ```bash
   # Visit: https://github.com/NoelKhan/medibot-web/actions
   # Watch workflows execute
   ```

### Short-term (Within 1 week)

1. **Setup Staging Environment**
   - Deploy to low-cost cloud provider (Digital Ocean, Render.com)
   - Test with real users
   - Monitor performance

2. **Configure Monitoring**
   - Setup CloudWatch/Stackdriver
   - Configure alerts
   - Add APM tool (optional)

3. **Security Audit**
   - Run security scanner
   - Review OWASP top 10
   - Enable rate limiting

### Long-term (Production Ready)

1. **Scale Testing**
   - Load test with realistic traffic
   - Optimize database queries
   - Configure auto-scaling

2. **Disaster Recovery**
   - Document rollback procedures
   - Test backup restoration
   - Setup multi-region (optional)

3. **Compliance**
   - HIPAA compliance (if storing medical data)
   - GDPR compliance (if EU users)
   - Data encryption at rest

---

## Support & Resources

### Documentation
- **Local**: `/docs/` directory in this repository
- **Kubernetes**: `infrastructure/k8s/README.md`
- **Authentication Changes**: `/docs/AUTHENTICATION_REMOVAL_COMPLETE.md`

### Quick Reference
- **Commands**: `/docs/QUICK_REFERENCE.md`
- **Verification**: `/docs/FINAL_VERIFICATION_CHECKLIST.md`

### Community Support
- NestJS: https://docs.nestjs.com
- React: https://react.dev
- Kubernetes: https://kubernetes.io/docs
- Docker: https://docs.docker.com

---

**Last Updated**: November 2, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
