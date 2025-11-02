# Kubernetes Deployment Test Results
**Date:** November 2, 2025  
**Cluster:** docker-desktop (Docker Desktop Kubernetes)  
**Test Script:** `scripts/testing/test-k8s-deployment.sh`

## ✅ Test Summary

### Prerequisites ✓
- [x] Docker installed and running
- [x] kubectl installed and configured
- [x] Kubernetes cluster running (Docker Desktop)
- [x] Docker images built successfully

### Deployment Status ✓

| Component | Status | Replicas | Ready | Image |
|-----------|--------|----------|-------|-------|
| **Backend** | ✅ Running | 2/2 | 2/2 | `medibot-backend:latest` |
| **Web Frontend** | ✅ Running | 2/2 | 2/2 | `medibot-web:latest` |
| **PostgreSQL** | ✅ Running | 1/1 | 1/1 | `postgres:16-alpine` |

### Services ✓

| Service | Type | Cluster IP | Port | Status |
|---------|------|------------|------|--------|
| medibot-backend | ClusterIP | 10.105.35.23 | 3000 | ✅ Active |
| medibot-web | ClusterIP | 10.107.198.180 | 80 | ✅ Active |
| postgres | ClusterIP (Headless) | None | 5432 | ✅ Active |

### Ingress ✓
- **Name:** medibot-ingress
- **Class:** nginx
- **Host:** medibot.local
- **Status:** ✅ Created

### Health Checks ✓

#### Backend API
```bash
$ kubectl run test-backend --rm -i --restart=Never --image=curlimages/curl:latest -- \
  curl -s http://medibot-backend:3000/api/health

Response:
{
  "status": "ok",
  "timestamp": "2025-11-02T08:06:02.561Z",
  "uptime": 1521.266595319
}
```
**Result:** ✅ PASSED

#### Web Frontend
```bash
$ kubectl run test-web --rm -i --restart=Never --image=curlimages/curl:latest -- \
  curl -s -o /dev/null -w "%{http_code}" http://medibot-web

Response: 200
```
**Result:** ✅ PASSED

#### PostgreSQL Database
```bash
$ kubectl exec postgres-0 -- pg_isready -U medibot

Response: /var/run/postgresql:5432 - accepting connections
```
**Result:** ✅ PASSED

## 🔧 Configuration Changes Made

### 1. Python AI Agent Made Optional
**File:** `medibot-backend/src/modules/ai-agent/python-manager.service.ts`

**Change:** Modified the `onModuleInit()` method to:
- Check for `DISABLE_PYTHON_AI` environment variable
- Skip Python AI Agent initialization if disabled
- Log a warning instead of throwing an error
- Allow backend to start without Python dependencies

**Reason:** The Docker image doesn't include Python 3.9, so the AI Agent cannot start in the basic Kubernetes deployment. The backend now gracefully degrades and continues without AI features.

### 2. Backend ConfigMap Updated
**File:** `infrastructure/k8s/backend/backend-deployment.yaml`

**Addition:**
```yaml
data:
  DISABLE_PYTHON_AI: "true"
```

**Reason:** Explicitly disable Python AI Agent for Kubernetes deployment until Python dependencies are included in the container image.

### 3. Web Deployment Image Fixed
**File:** `infrastructure/k8s/web/web-deployment.yaml`

**Change:**
```yaml
# Before:
image: ghcr.io/noelkhan/medibot/medibot-web:latest
imagePullPolicy: Always

# After:
image: medibot-web:latest
imagePullPolicy: IfNotPresent
```

**Reason:** Use locally built image instead of trying to pull from GitHub Container Registry, which requires authentication.

## 📊 Resource Usage

### Pod Distribution
```
NAME                               IP          NODE
medibot-backend-7f56b8889d-5h2p4   10.1.0.10   docker-desktop
medibot-backend-7f56b8889d-9vwc5   10.1.0.9    docker-desktop
medibot-web-5dbbb9ff5d-cg9sp       10.1.0.14   docker-desktop
medibot-web-5dbbb9ff5d-z5h4q       10.1.0.13   docker-desktop
postgres-0                         10.1.0.6    docker-desktop
```

### Resource Limits
- **Backend:** 256Mi-512Mi RAM, 250m-500m CPU
- **Web:** (Default)
- **PostgreSQL:** (Default)

## 🌐 Access Instructions

### Backend API
```bash
kubectl port-forward svc/medibot-backend 3001:3000
curl http://localhost:3001/api/health
```

### Web Frontend
```bash
kubectl port-forward svc/medibot-web 8081:80
open http://localhost:8081
```

### PostgreSQL Database
```bash
kubectl port-forward postgres-0 5432:5432
psql -h localhost -U medibot -d medibot
```

### Using Ingress (Requires Ingress Controller)
1. Install NGINX Ingress Controller:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

2. Add to `/etc/hosts`:
```
127.0.0.1 medibot.local
```

3. Access:
- Web: `http://medibot.local`
- API: `http://medibot.local/api`

## 🐛 Issues Encountered & Resolutions

### Issue 1: Backend Pods CrashLoopBackOff
**Symptom:** Backend pods failing with "spawn python3.9 ENOENT"

**Root Cause:** Backend tries to start Python AI Agent service on initialization, but Python 3.9 is not available in the container.

**Resolution:** 
- Modified `python-manager.service.ts` to handle missing Python gracefully
- Added `DISABLE_PYTHON_AI` environment variable option
- Backend now starts successfully without Python AI Agent

### Issue 2: Web Pods ImagePullBackOff
**Symptom:** Web pods trying to pull from `ghcr.io/noelkhan/medibot/medibot-web:latest`

**Root Cause:** Deployment configured to use GitHub Container Registry without proper authentication.

**Resolution:**
- Changed image reference to `medibot-web:latest` (local image)
- Changed `imagePullPolicy` to `IfNotPresent`

### Issue 3: Web Pods FailedMount
**Symptom:** `MountVolume.SetUp failed for volume "nginx-config" : configmap "medibot-web-config" not found`

**Root Cause:** ConfigMap not created before deployment.

**Resolution:**
- Applied `web/web-configmap.yaml` before deployment
- Pods successfully mounted the ConfigMap

## 🚀 Scaling Tests

### Horizontal Scaling
```bash
# Scale backend to 3 replicas
kubectl scale deployment medibot-backend --replicas=3

# Verify
kubectl get pods -l app=medibot-backend
```

**Result:** ✅ Successfully scaled, all replicas became ready

### Load Distribution
With 2 replicas, requests are automatically distributed across pods via the ClusterIP service.

## 📝 Logs

### Backend Startup Logs
```
🤖 Initializing Python AIAgent service...
⚠️  Python AIAgent is disabled via DISABLE_PYTHON_AI environment variable
⚠️  AI chat features will not be available

============================================
   MediBot Backend Server Started Successfully
============================================
🌐 Server running on: http://localhost:3000
📚 API Docs: http://localhost:3000/api/docs
🔌 API Endpoints: http://localhost:3000/api
📱 CORS: *
🔒 Security: Enabled (Helmet)
📝 Logging: Winston (info)
============================================
```

### Web Frontend Logs
```
2025/11/02 07:57:46 [notice] 1#1: start worker processes
2025/11/02 07:57:46 [notice] 1#1: start worker process 21-25
10.1.0.18 - - [02/Nov/2025:08:06:05 +0000] "GET / HTTP/1.1" 200 703
```

## ✅ Test Conclusion

**Overall Status:** ✅ **PASSED**

All core services are running successfully in Kubernetes:
- ✅ Backend API is healthy and responding
- ✅ Web frontend is serving content
- ✅ PostgreSQL database is accepting connections
- ✅ Services are accessible within the cluster
- ✅ Horizontal scaling works correctly
- ✅ Health checks are passing

### Limitations
- ⚠️  Python AI Agent is disabled (not included in container image)
- ⚠️  AI chat features are unavailable
- ⚠️  Ingress requires NGINX Ingress Controller to be installed
- ⚠️  Metrics server not installed (pod resource metrics unavailable)

### Recommendations for Production

1. **Add Python Support:** Include Python 3.9+ and dependencies in backend Docker image
2. **Enable AI Agent:** Remove `DISABLE_PYTHON_AI` flag once Python is available
3. **Install Metrics Server:** For resource monitoring and HPA
4. **Configure Ingress Controller:** For external access
5. **Add Persistent Storage:** For PostgreSQL data persistence
6. **Configure Resource Limits:** Optimize based on actual usage
7. **Enable TLS:** Add SSL/TLS certificates for secure communication
8. **Add Monitoring:** Prometheus, Grafana for observability
9. **Implement GitOps:** Use ArgoCD or Flux for deployment automation

## 📂 Test Artifacts

- **Test Script:** `scripts/testing/test-k8s-deployment.sh`
- **Verification Script:** `scripts/testing/verify-k8s-deployment.sh`
- **Deployment YAMLs:** `infrastructure/k8s/`
- **Test Date:** 2025-11-02
- **Duration:** ~25 minutes (including build time)

---

**Test Conducted By:** GitHub Copilot  
**Platform:** Docker Desktop Kubernetes on macOS
