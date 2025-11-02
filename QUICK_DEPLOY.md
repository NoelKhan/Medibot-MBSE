# 🚀 Quick Deploy - MediBot

**Get your MediBot app running in production in under 30 minutes**

---

## Option 1: Local Development (5 minutes)

```bash
# 1. Start databases
docker run -d --name medibot-postgres \
  -e POSTGRES_DB=medibot -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:14-alpine

docker run -d --name medibot-redis -p 6379:6379 redis:7-alpine

# 2. Configure environment (create .env files)
cd medibot-backend
cat > .env << EOF
NODE_ENV=development
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=medibot
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
REDIS_HOST=localhost
REDIS_PORT=6379
AI_AGENT_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
EOF

cd ../medibot-web
echo "VITE_API_URL=http://localhost:3001/api" > .env

# 3. Start services
cd ../medibot-backend && npm install && npm run start:dev &
cd ../medibot-web && npm install && npm run dev &

# 4. Open browser
open http://localhost:5173
```

**✅ Done!** Backend on :3001, Web on :5173

---

## Option 2: Docker Compose (2 minutes)

```bash
cd infrastructure/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Services:
# - Web: http://localhost:3000
# - Backend: http://localhost:3001
# - PostgreSQL: localhost:5432
```

**✅ Done!** All services running in containers

---

## Option 3: CI/CD Setup (10 minutes)

### Step 1: Configure Secrets

```bash
# Install GitHub CLI (if not installed)
brew install gh

# Authenticate
gh auth login

# Run setup script
./scripts/utilities/setup-cicd.sh

# OR manually:
gh secret set JWT_SECRET --body "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
gh secret set DATABASE_PASSWORD --body "test-password"
gh secret set VITE_API_URL_PROD --body "https://api.yourdomain.com"
```

### Step 2: Push Code

```bash
git add .
git commit -m "chore: Deploy to production"
git push origin main
```

### Step 3: Monitor Build

Visit: https://github.com/NoelKhan/medibot-web/actions

**✅ Done!** CI/CD pipeline runs automatically on push

---

## Option 4: Render.com Deploy (15 minutes)

**Easiest production deployment - no Kubernetes needed**

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 2. Create Database
- Dashboard > New > PostgreSQL
- Name: `medibot-db`
- Plan: Free tier
- Copy connection string

### 3. Deploy Backend
- New > Web Service
- Connect repository: `noelkhan/medibot-web`
- Name: `medibot-backend`
- Root Directory: `medibot-backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Add environment variables:
  ```
  DATABASE_URL=<from step 2>
  JWT_SECRET=<generate random>
  NODE_ENV=production
  ```

### 4. Deploy Frontend
- New > Static Site
- Connect repository: `noelkhan/medibot-web`
- Name: `medibot-web`
- Root Directory: `medibot-web`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Add environment variables:
  ```
  VITE_API_URL=<backend URL from step 3>
  ```

**✅ Done!** App live at https://medibot-web.onrender.com

---

## Option 5: Kubernetes (30 minutes)

### Prerequisites
- Kubernetes cluster (EKS, GKE, or minikube)
- kubectl installed
- Docker images pushed to registry

### Quick Deploy

```bash
cd infrastructure/k8s

# 1. Create namespace
kubectl create namespace medibot

# 2. Create secrets
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres \
  --from-literal=password=$(openssl rand -base64 32) \
  -n medibot

kubectl create secret generic jwt-secret \
  --from-literal=secret=$(openssl rand -base64 32) \
  -n medibot

# 3. Deploy all services
./deploy.sh

# 4. Check status
kubectl get all -n medibot

# 5. Port forward (for testing)
kubectl port-forward svc/web-service 3000:80 -n medibot
```

**✅ Done!** App running on Kubernetes

---

## Verification Checklist

After deployment, test these endpoints:

```bash
# Backend health check
curl https://your-api-url/health

# Anonymous chat (no auth required)
curl -X POST https://your-api-url/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello"}'

# Protected endpoint (should require auth)
curl https://your-api-url/api/bookings

# Web app
open https://your-web-url
```

---

## Current Status

✅ **Ready to Deploy:**
- [x] Authentication removed from chat/AI endpoints
- [x] Backend adapts to requests with/without tokens
- [x] Database schema updated for anonymous users
- [x] Docker images build successfully
- [x] All tests passing
- [x] CI/CD workflows configured
- [x] Documentation complete

⚠️ **Needs Configuration:**
- [ ] GitHub secrets (run `./scripts/utilities/setup-cicd.sh`)
- [ ] Production database URL
- [ ] Production API domain
- [ ] SSL certificates (auto with Render/Vercel)

---

## Cost Estimates

### Free Tier Options
- **Render.com**: Free (PostgreSQL 256MB, Web Service)
- **Vercel**: Free (Unlimited bandwidth, auto-scaling)
- **Railway**: Free tier available
- **Fly.io**: Free (3 VMs)

### Paid Options (Starting Prices)
- **Digital Ocean K8s**: $12/month (2GB nodes)
- **AWS EKS**: $73/month ($0.10/hour for cluster)
- **GCP GKE**: Free cluster + $0.04/hour per node
- **Azure AKS**: Free cluster + ~$30/month per node

---

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Web
```

### Database Connection Failed
```bash
# Check containers
docker ps | grep postgres

# Restart
docker restart medibot-postgres

# Check logs
docker logs medibot-postgres
```

### CI/CD Build Fails
```bash
# Check secrets are configured
gh secret list

# View workflow logs
gh run list
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>
```

### Kubernetes Pod Crashes
```bash
# Check logs
kubectl logs -f deployment/backend -n medibot

# Describe pod
kubectl describe pod <pod-name> -n medibot

# Check secrets
kubectl get secrets -n medibot
```

---

## Next Steps After Deployment

1. **Setup Monitoring**
   - Configure health check alerts
   - Enable error tracking (Sentry)
   - Setup uptime monitoring (UptimeRobot)

2. **Custom Domain**
   - Buy domain (Namecheap, Google Domains)
   - Configure DNS
   - Enable SSL (auto with most platforms)

3. **Scale Up**
   - Enable auto-scaling
   - Add CDN (CloudFlare)
   - Configure caching

4. **Security**
   - Enable rate limiting
   - Configure firewall rules
   - Setup DDoS protection

---

## Support

📖 **Full Guide**: `DEPLOYMENT_GUIDE.md`  
📋 **Detailed Docs**: `/docs/` directory  
🔍 **Troubleshooting**: `DEPLOYMENT_GUIDE.md#troubleshooting`  
✅ **Verification**: `/docs/FINAL_VERIFICATION_CHECKLIST.md`

---

**Last Updated**: November 2, 2025  
**Status**: ✅ Production Ready  
**Time to Deploy**: 5-30 minutes depending on option
