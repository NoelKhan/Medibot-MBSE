# MediBot Kubernetes Deployment
# ==============================

This directory contains Kubernetes manifests for deploying the MediBot application stack.

## Architecture

```
┌─────────────────────────────────────────────┐
│            Ingress (nginx)                  │
│         medibot.local                       │
└─────────────────────────────────────────────┘
              │
              ├─── /api ────► Backend Service (ClusterIP)
              │                    │
              │                    ├─► Backend Pod 1 (NestJS)
              │                    └─► Backend Pod 2 (NestJS)
              │                           │
              │                           ▼
              │                    PostgreSQL StatefulSet
              │                    (Persistent Storage)
              │
              └─── / ───────► Web Service (ClusterIP)
                                   │
                                   ├─► Web Pod 1 (nginx + React)
                                   └─► Web Pod 2 (nginx + React)
```

## Components

### 1. PostgreSQL StatefulSet
- **File**: `postgres-statefulset.yaml`
- **Purpose**: Persistent database with 5GB storage
- **Replicas**: 1 (single instance)
- **Resources**: 256Mi-512Mi memory, 250m-500m CPU
- **Health Checks**: pg_isready probe

### 2. Backend Deployment
- **File**: `backend-deployment.yaml`
- **Purpose**: NestJS API server
- **Replicas**: 2 (horizontal scaling ready)
- **Resources**: 256Mi-512Mi memory, 250m-500m CPU
- **Health Checks**: HTTP /health endpoint
- **Auto-scaling**: Via HPA (2-5 replicas)

### 3. Web Frontend Deployment
- **File**: `web-deployment.yaml`
- **Purpose**: React SPA served with nginx
- **Replicas**: 2 (horizontal scaling ready)
- **Resources**: 64Mi-128Mi memory, 100m-200m CPU
- **Health Checks**: HTTP / endpoint

### 4. Ingress
- **File**: `ingress.yaml`
- **Purpose**: Route external traffic
- **Rules**:
  - `/api/*` → Backend Service
  - `/*` → Web Service

### 5. Horizontal Pod Autoscaler
- **File**: `hpa.yaml`
- **Purpose**: Auto-scale backend based on load
- **Triggers**: CPU > 70% or Memory > 80%
- **Range**: 2-5 replicas

## Prerequisites

1. **Kubernetes Cluster** (one of the following):
   - Minikube: `brew install minikube`
   - Kind: `brew install kind`
   - Docker Desktop with Kubernetes enabled

2. **kubectl**: `brew install kubectl`

3. **Nginx Ingress Controller**:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```

4. **Docker images built**:
   ```bash
   # Build backend image
   cd ../medibot-backend
   docker build -t medibot-backend:latest .
   
   # Build web image
   cd ../medibot-web
   docker build -t medibot-web:latest .
   ```

## Quick Start

### Using Minikube

1. **Start Minikube**:
   ```bash
   minikube start --cpus=4 --memory=8192
   ```

2. **Enable addons**:
   ```bash
   minikube addons enable ingress
   minikube addons enable metrics-server
   ```

3. **Load Docker images into Minikube**:
   ```bash
   minikube image load medibot-backend:latest
   minikube image load medibot-web:latest
   ```

4. **Deploy all components**:
   ```bash
   kubectl apply -f k8s/postgres-statefulset.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/web-deployment.yaml
   kubectl apply -f k8s/ingress.yaml
   kubectl apply -f k8s/hpa.yaml
   ```

5. **Add host entry**:
   ```bash
   echo "$(minikube ip) medibot.local" | sudo tee -a /etc/hosts
   ```

6. **Run database migrations**:
   ```bash
   # Get backend pod name
   POD=$(kubectl get pods -l app=medibot-backend -o jsonpath='{.items[0].metadata.name}')
   
   # Run migrations
   kubectl exec -it $POD -- npm run migration:run
   ```

7. **Access the application**:
   - Web: http://medibot.local
   - API: http://medibot.local/api

### Using Kind

1. **Create cluster**:
   ```bash
   kind create cluster --name medibot
   ```

2. **Load Docker images**:
   ```bash
   kind load docker-image medibot-backend:latest --name medibot
   kind load docker-image medibot-web:latest --name medibot
   ```

3. **Install ingress controller**:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
   ```

4. **Deploy all components** (same as Minikube step 4)

5. **Port forward** (Kind doesn't have an IP):
   ```bash
   kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80
   ```

6. **Access the application**:
   - Web: http://localhost:8080
   - API: http://localhost:8080/api

## Monitoring

### Check deployment status:
```bash
kubectl get all
```

### View logs:
```bash
# Backend logs
kubectl logs -f deployment/medibot-backend

# Web logs
kubectl logs -f deployment/medibot-web

# PostgreSQL logs
kubectl logs -f statefulset/postgres
```

### Check pod resources:
```bash
kubectl top pods
```

### Check HPA status:
```bash
kubectl get hpa
kubectl describe hpa medibot-backend-hpa
```

## Scaling

### Manual scaling:
```bash
# Scale backend
kubectl scale deployment medibot-backend --replicas=3

# Scale web
kubectl scale deployment medibot-web --replicas=3
```

### Test auto-scaling:
```bash
# Generate load
kubectl run -it --rm load-generator --image=busybox --restart=Never -- /bin/sh -c "while true; do wget -q -O- http://medibot-backend:3000/api/health; done"
```

## Troubleshooting

### Pods not starting:
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Database connection issues:
```bash
# Check PostgreSQL service
kubectl get svc postgres

# Test connection from backend pod
kubectl exec -it <backend-pod> -- env | grep DB_
```

### Ingress not working:
```bash
# Check ingress status
kubectl get ingress
kubectl describe ingress medibot-ingress

# Check ingress controller
kubectl get pods -n ingress-nginx
```

### Reset everything:
```bash
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/web-deployment.yaml
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/postgres-statefulset.yaml
kubectl delete pvc postgres-storage-postgres-0
```

## Production Considerations

1. **Secrets Management**: Use external secrets management (Vault, AWS Secrets Manager)
2. **Database Backups**: Implement automated backup strategy
3. **Monitoring**: Deploy Prometheus + Grafana
4. **Logging**: Deploy EFK/ELK stack
5. **TLS/SSL**: Configure cert-manager for HTTPS
6. **Resource Limits**: Adjust based on actual usage patterns
7. **Network Policies**: Implement pod-to-pod communication restrictions
8. **Pod Disruption Budgets**: Ensure availability during updates
9. **Rolling Updates**: Configure deployment strategy
10. **Multi-zone Deployment**: Spread across availability zones

## Environment Variables

### Backend ConfigMap
- `NODE_ENV`: production
- `PORT`: 3000
- `DB_HOST`: postgres
- `DB_PORT`: 5432
- `DB_NAME`: medibot
- `DB_USER`: medibot
- `CORS_ORIGIN`: Allowed origins

### Backend Secrets
- `DB_PASSWORD`: PostgreSQL password
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: Refresh token secret

### PostgreSQL Secret
- `password`: Database password

## Maintenance

### Update backend:
```bash
# Build new image
docker build -t medibot-backend:v2 ../medibot-backend

# Load to cluster
minikube image load medibot-backend:v2

# Update deployment
kubectl set image deployment/medibot-backend backend=medibot-backend:v2
```

### Update web:
```bash
# Build new image
docker build -t medibot-web:v2 ../medibot-web

# Load to cluster
minikube image load medibot-web:v2

# Update deployment
kubectl set image deployment/medibot-web web=medibot-web:v2
```

### Backup database:
```bash
kubectl exec -it postgres-0 -- pg_dump -U medibot medibot > backup.sql
```

### Restore database:
```bash
kubectl exec -i postgres-0 -- psql -U medibot medibot < backup.sql
```

## License

MIT
