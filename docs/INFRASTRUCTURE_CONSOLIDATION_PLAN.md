# Infrastructure Consolidation Analysis & Fix Plan
**Date:** November 2, 2025  
**Status:** 🔧 IN PROGRESS

---

## 🎯 OBJECTIVE
Consolidate all Docker/K8s configs from individual projects into root `/infrastructure/` directory and ensure everything runs from root.

---

## 📊 CURRENT STATE ANALYSIS

### ✅ What's Been Moved to Root

#### `/infrastructure/docker/`
```
infrastructure/docker/
├── docker-compose.yml              # ✅ Main compose file (but has path issues)
├── backend/
│   ├── docker-compose.yml          # ❓ Duplicate - should be removed
│   ├── docker-compose.prod.yml
│   └── docker-compose.test.yml
├── web/
│   ├── Dockerfile                  # ✅ Web Dockerfile exists
│   └── Dockerfile.web
├── mobile/
│   ├── Dockerfile                  # ✅ Mobile Dockerfile exists
│   └── docker-compose.prod.yml
└── (missing backend Dockerfile)    # ❌ MISSING
```

#### `/infrastructure/k8s/`
```
infrastructure/k8s/
├── README.md
├── deploy.sh
├── backend/
│   ├── ai-agent-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── ollama-statefulset.yaml
│   └── postgres-statefulset.yaml
├── web/
│   ├── nginx.conf
│   ├── web-configmap.yaml
│   ├── web-deployment.yaml
│   ├── web-hpa.yaml
│   ├── web-ingress.yaml
│   └── web-service.yaml
└── mobile/
    ├── configmap.yaml
    ├── deployment.yaml
    ├── mobile-deployment.yaml
    └── nginx.conf
```

#### `/infrastructure/` (root level)
```
infrastructure/
├── Dockerfile                      # ✅ Backend Dockerfile (misplaced)
└── infrastructure-mob/             # ❓ Unknown purpose
```

### ❌ What's Still in Individual Projects

#### Backend (`medibot-backend/`)
- `python/aiagent/Dockerfile` - ✅ Should stay (AI agent specific)
- ❌ No Dockerfiles found for backend itself (MOVED)

#### Web (`medibot-web/`)
- ❌ No Dockerfiles found (MOVED to infrastructure)
- ❌ No K8s configs found (MOVED to infrastructure)

#### Mobile (`medibot-mobile/`)
- ❌ No Dockerfiles found (MOVED to infrastructure)
- ❌ No K8s configs found (MOVED to infrastructure)

---

## 🚨 IDENTIFIED ISSUES

### Issue #1: docker-compose.yml Path References ❌
**File:** `/infrastructure/docker/docker-compose.yml`

**Problem:**
```yaml
backend:
  build:
    context: ../../medibot-backend
    dockerfile: infrastructure/Docker/Dockerfile  # ❌ WRONG PATH
```

**Current structure:** Dockerfile is at `/infrastructure/Dockerfile`  
**Referenced path:** `medibot-backend/infrastructure/Docker/Dockerfile` (doesn't exist)

**Impact:** Backend container cannot build

---

### Issue #2: Missing Backend Dockerfile in Proper Location ❌
**Expected:** `/infrastructure/docker/backend/Dockerfile`  
**Actual:** `/infrastructure/Dockerfile` (at root of infrastructure/)

**Problem:** Dockerfile exists but in wrong location

---

### Issue #3: Web Dockerfile Path Reference ❌
**File:** `/infrastructure/docker/docker-compose.yml`

```yaml
web:
  build:
    context: ../../medibot-web
    dockerfile: infrastructure/Dockerfile  # ❌ WRONG PATH
```

**Current structure:** Dockerfile is at `/infrastructure/docker/web/Dockerfile`  
**Referenced path:** `medibot-web/infrastructure/Dockerfile` (doesn't exist)

---

### Issue #4: Duplicate docker-compose Files
- `/infrastructure/docker/docker-compose.yml` (MAIN)
- `/infrastructure/docker/backend/docker-compose.yml` (DUPLICATE?)

**Decision needed:** Which one to keep?

---

### Issue #5: nginx Configuration References
Web and mobile Dockerfiles reference nginx configs that may not exist in new locations.

---

## 🔧 CONSOLIDATION STRATEGY

### Option A: Flat Structure (Recommended)
```
infrastructure/
├── docker/
│   ├── Dockerfile.backend          # Backend Dockerfile
│   ├── Dockerfile.web              # Web Dockerfile  
│   ├── Dockerfile.mobile           # Mobile Dockerfile
│   ├── Dockerfile.aiagent          # AI Agent Dockerfile
│   ├── docker-compose.yml          # Main compose (dev)
│   ├── docker-compose.prod.yml     # Production compose
│   └── docker-compose.test.yml     # Test compose
└── k8s/
    ├── backend-deployment.yaml
    ├── web-deployment.yaml
    ├── mobile-deployment.yaml
    ├── ai-agent-deployment.yaml
    ├── postgres-statefulset.yaml
    ├── redis-statefulset.yaml
    ├── ollama-statefulset.yaml
    ├── ingress.yaml
    ├── hpa.yaml
    └── deploy.sh
```

**Pros:**
- ✅ All Dockerfiles in one place
- ✅ Easy to find and maintain
- ✅ Clear naming convention
- ✅ Simple path references

**Cons:**
- ❌ Less organized for large projects
- ❌ All configs in one directory

### Option B: Nested Structure (Current Attempt)
```
infrastructure/
├── docker/
│   ├── docker-compose.yml
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── docker-compose.prod.yml
│   ├── web/
│   │   ├── Dockerfile
│   │   └── docker-compose.prod.yml
│   └── mobile/
│       ├── Dockerfile
│       └── docker-compose.prod.yml
└── k8s/
    ├── backend/
    │   └── *.yaml
    ├── web/
    │   └── *.yaml
    └── mobile/
        └── *.yaml
```

**Pros:**
- ✅ Better organization
- ✅ Separation of concerns
- ✅ Easier to find service-specific configs

**Cons:**
- ❌ More complex paths
- ❌ Harder to reference in docker-compose

---

## ✅ RECOMMENDED SOLUTION: Hybrid Approach

```
infrastructure/
├── docker/
│   ├── docker-compose.yml          # Main: references ./backend/Dockerfile, ./web/Dockerfile, etc.
│   ├── docker-compose.prod.yml     # Production
│   ├── docker-compose.test.yml     # Testing
│   ├── backend/
│   │   └── Dockerfile              # Backend service Dockerfile
│   ├── web/
│   │   └── Dockerfile              # Web service Dockerfile
│   ├── mobile/
│   │   └── Dockerfile              # Mobile service Dockerfile
│   └── nginx/
│       └── nginx.conf              # Shared nginx config
│
└── k8s/
    ├── backend/                     # Backend K8s manifests
    ├── web/                         # Web K8s manifests
    ├── mobile/                      # Mobile K8s manifests
    ├── shared/                      # Shared resources (postgres, redis, etc.)
    │   ├── postgres-statefulset.yaml
    │   ├── redis-deployment.yaml
    │   └── ollama-statefulset.yaml
    └── deploy.sh                    # Deployment script
```

---

## 📝 IMPLEMENTATION PLAN

### Step 1: Move Backend Dockerfile ✅
```bash
mv infrastructure/Dockerfile infrastructure/docker/backend/Dockerfile
```

### Step 2: Fix docker-compose.yml Paths
Update `/infrastructure/docker/docker-compose.yml`:

```yaml
services:
  backend:
    build:
      context: ../../medibot-backend
      dockerfile: ../infrastructure/docker/backend/Dockerfile  # FIX THIS
    # ...

  web:
    build:
      context: ../../medibot-web
      dockerfile: ../infrastructure/docker/web/Dockerfile      # FIX THIS
    # ...

  mobile:
    build:
      context: ../../medibot-mobile
      dockerfile: ../infrastructure/docker/mobile/Dockerfile   # FIX THIS
```

**WAIT!** This is getting complicated. Better approach:

```yaml
services:
  backend:
    build:
      context: ../..              # Root of project
      dockerfile: infrastructure/docker/backend/Dockerfile
      args:
        - BUILD_CONTEXT=medibot-backend
    # ...

  web:
    build:
      context: ../..              # Root of project
      dockerfile: infrastructure/docker/web/Dockerfile
      args:
        - BUILD_CONTEXT=medibot-web
    # ...
```

### Step 3: Update Dockerfiles to Accept Build Context
Each Dockerfile needs to work from root context.

#### Backend Dockerfile Pattern:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY medibot-backend/package*.json ./
RUN npm ci
COPY medibot-backend/ ./
RUN npm run build
```

#### Web Dockerfile Pattern:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY medibot-web/package*.json ./
RUN npm ci
COPY medibot-web/ ./
RUN npm run build
```

### Step 4: Remove Duplicate Files
- Remove `/infrastructure/docker/backend/docker-compose.yml` (if duplicate)
- Remove `/infrastructure/docker/backend/docker-compose.prod.yml` (consolidate)
- Remove `/infrastructure/docker/mobile/docker-compose.prod.yml` (consolidate)

### Step 5: Update K8s Manifests
Update image references in K8s deployments:

```yaml
spec:
  containers:
  - name: backend
    image: medibot-backend:latest
    imagePullPolicy: Never  # For local builds
```

### Step 6: Create Build Script
Create `/infrastructure/docker/build.sh`:

```bash
#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔨 Building MediBot Docker Images..."

# Build from root context
docker-compose build backend
docker-compose build web
docker-compose build mobile

echo "✅ Build complete!"
```

### Step 7: Create Start Script
Create `/infrastructure/docker/start.sh`:

```bash
#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🚀 Starting MediBot Platform..."
docker-compose up -d

echo "✅ Platform started!"
echo "📊 Backend: http://localhost:3001"
echo "🌐 Web: http://localhost:3000"
```

---

## 🧪 TESTING PLAN

### Test 1: Build All Images
```bash
cd /Users/noelkhan/dev\ mbse/Medibot-MBSE/infrastructure/docker
docker-compose build
```

**Expected:** All images build successfully

### Test 2: Start Services
```bash
docker-compose up -d
```

**Expected:** All services start without errors

### Test 3: Health Checks
```bash
curl http://localhost:3001/health  # Backend
curl http://localhost:3000          # Web
```

**Expected:** Both respond with 200 OK

### Test 4: View Logs
```bash
docker-compose logs -f backend
```

**Expected:** No errors, application starts successfully

---

## 📋 FILES TO MODIFY/CREATE

### Create:
1. `/infrastructure/docker/backend/Dockerfile`
2. `/infrastructure/docker/build.sh`
3. `/infrastructure/docker/start.sh`
4. `/infrastructure/docker/stop.sh`

### Modify:
1. `/infrastructure/docker/docker-compose.yml` - Fix all paths
2. `/infrastructure/docker/web/Dockerfile` - Update context paths
3. `/infrastructure/docker/mobile/Dockerfile` - Update context paths
4. All K8s manifests - Verify image references

### Move:
1. `/infrastructure/Dockerfile` → `/infrastructure/docker/backend/Dockerfile`

### Delete:
1. `/infrastructure/docker/backend/docker-compose.yml` (if duplicate)
2. `/infrastructure/docker/backend/docker-compose.prod.yml` (consolidate)
3. `/infrastructure/docker/mobile/docker-compose.prod.yml` (consolidate)

---

## 🎯 SUCCESS CRITERIA

- [ ] All Dockerfiles in `/infrastructure/docker/{service}/`
- [ ] Main docker-compose.yml runs from `/infrastructure/docker/`
- [ ] All services build successfully
- [ ] All services start without errors
- [ ] Health checks pass for all services
- [ ] No hardcoded paths to individual project infrastructure folders
- [ ] K8s manifests reference correct Dockerfiles
- [ ] Documentation updated

---

## ⏭️ NEXT: Auth Removal (After Infrastructure is Fixed)

Only proceed with auth removal AFTER:
1. ✅ Infrastructure is consolidated and tested
2. ✅ All services build and run successfully
3. ✅ Paths are verified and working
4. ✅ Health checks pass

---

*Document prepared by: GitHub Copilot*  
*Last updated: November 2, 2025*
