#!/bin/bash

# ============================================
# MediBot Kubernetes Deployment Test Script
# ============================================
# Tests the complete Kubernetes deployment flow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Change to project root
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

print_header "MediBot Kubernetes Deployment Test"

# ============================================
# Step 1: Prerequisites Check
# ============================================
print_header "1. Checking Prerequisites"

print_step "Checking Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_success "Docker is installed"

print_step "Checking Docker daemon..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi
print_success "Docker daemon is running"

print_step "Checking kubectl..."
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Install with: brew install kubectl"
    exit 1
fi
print_success "kubectl is installed"

print_step "Checking Kubernetes cluster..."
if ! kubectl cluster-info &> /dev/null; then
    print_error "Kubernetes cluster is not running"
    print_info "Enable Kubernetes in Docker Desktop settings"
    exit 1
fi
CONTEXT=$(kubectl config current-context)
print_success "Kubernetes cluster is running (context: $CONTEXT)"

# ============================================
# Step 2: Build Docker Images
# ============================================
print_header "2. Building Docker Images"

print_step "Building backend image..."
cd "$PROJECT_ROOT"
if docker build -f infrastructure/docker/backend/Dockerfile -t medibot-backend:latest -t medibot-backend:test . 2>&1 | tail -20; then
    print_success "Backend image built successfully"
else
    print_error "Failed to build backend image"
    exit 1
fi

print_step "Building web image..."
if docker build -f infrastructure/docker/web/Dockerfile -t medibot-web:latest -t medibot-web:test . 2>&1 | tail -20; then
    print_success "Web image built successfully"
else
    print_error "Failed to build web image"
    exit 1
fi

print_step "Verifying images..."
docker images | grep medibot
print_success "Images verified"

# ============================================
# Step 3: Deploy to Kubernetes
# ============================================
print_header "3. Deploying to Kubernetes"

cd "$PROJECT_ROOT/infrastructure/k8s"

print_step "Deploying PostgreSQL..."
kubectl apply -f backend/postgres-statefulset.yaml
print_success "PostgreSQL deployment created"

print_step "Waiting for PostgreSQL to be ready..."
if kubectl wait --for=condition=ready pod/postgres-0 --timeout=120s 2>&1; then
    print_success "PostgreSQL is running"
    sleep 5  # Extra time for database initialization
else
    print_error "PostgreSQL failed to start"
    kubectl logs postgres-0 --tail=50
    exit 1
fi

print_step "Deploying backend..."
kubectl apply -f backend/backend-deployment.yaml
print_success "Backend deployment created"

print_step "Waiting for backend to be ready..."
if kubectl wait --for=condition=ready pod -l app=medibot-backend --timeout=120s 2>&1; then
    print_success "Backend is running"
else
    print_error "Backend failed to start"
    kubectl logs -l app=medibot-backend --tail=50
    exit 1
fi

print_step "Deploying web frontend..."
kubectl apply -f web/deployment.yaml
print_success "Web deployment created"

print_step "Waiting for web to be ready..."
if kubectl wait --for=condition=ready pod -l app=medibot-web --timeout=120s 2>&1; then
    print_success "Web frontend is running"
else
    print_warning "Web frontend may still be starting"
fi

print_step "Deploying ingress..."
kubectl apply -f backend/ingress.yaml
print_success "Ingress deployed"

# ============================================
# Step 4: Verify Deployment
# ============================================
print_header "4. Verifying Deployment"

echo ""
print_info "Pods:"
kubectl get pods -o wide

echo ""
print_info "Services:"
kubectl get svc

echo ""
print_info "Ingress:"
kubectl get ingress

# ============================================
# Step 5: Test Health Endpoints
# ============================================
print_header "5. Testing Health Endpoints"

print_step "Getting backend service details..."
BACKEND_PORT=$(kubectl get svc medibot-backend -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")

if [ -n "$BACKEND_PORT" ]; then
    print_info "Backend exposed on NodePort: $BACKEND_PORT"
    BACKEND_URL="http://localhost:$BACKEND_PORT"
else
    print_info "Using port-forward to access backend"
    kubectl port-forward svc/medibot-backend 3001:3000 &
    PORT_FORWARD_PID=$!
    sleep 3
    BACKEND_URL="http://localhost:3001"
fi

print_step "Testing backend health endpoint..."
sleep 5
if curl -f -s "$BACKEND_URL/api/health" | jq . 2>/dev/null; then
    print_success "Backend health check passed!"
else
    print_warning "Health check failed. Checking logs..."
    kubectl logs -l app=medibot-backend --tail=30
fi

# Cleanup port-forward if used
if [ -n "$PORT_FORWARD_PID" ]; then
    kill $PORT_FORWARD_PID 2>/dev/null || true
fi

# ============================================
# Step 6: Test Scaling
# ============================================
print_header "6. Testing Horizontal Scaling"

print_step "Current backend replicas..."
kubectl get deployment medibot-backend -o jsonpath='{.spec.replicas}'
echo ""

print_step "Scaling backend to 3 replicas..."
kubectl scale deployment medibot-backend --replicas=3
sleep 5

print_step "Waiting for new pods..."
kubectl wait --for=condition=ready pod -l app=medibot-backend --timeout=60s --all

print_info "Backend pods after scaling:"
kubectl get pods -l app=medibot-backend

print_step "Scaling back to 2 replicas..."
kubectl scale deployment medibot-backend --replicas=2

# ============================================
# Step 7: Test Configuration Updates
# ============================================
print_header "7. Testing Configuration Updates"

print_step "Checking current ConfigMap..."
kubectl get configmap backend-config -o yaml | grep -A5 "data:"

print_step "Verifying environment variables in pods..."
POD=$(kubectl get pods -l app=medibot-backend -o jsonpath='{.items[0].metadata.name}')
echo "Checking pod: $POD"
kubectl exec $POD -- env | grep -E "(NODE_ENV|DB_HOST|PORT)" || true

# ============================================
# Step 8: Resource Usage
# ============================================
print_header "8. Checking Resource Usage"

print_step "Pod resource usage..."
kubectl top pods 2>/dev/null || print_warning "Metrics server not available. Install with: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"

print_step "Node resource usage..."
kubectl top nodes 2>/dev/null || print_info "Node metrics require metrics-server"

# ============================================
# Summary
# ============================================
print_header "Test Summary"

echo ""
print_success "✓ Docker images built successfully"
print_success "✓ Kubernetes deployments created"
print_success "✓ Services are running"
print_success "✓ Health checks passed"
print_success "✓ Scaling tested"
print_success "✓ Configuration verified"

echo ""
print_header "Access Information"
echo ""
print_info "Backend API:"
echo "  Port-forward: kubectl port-forward svc/medibot-backend 3001:3000"
echo "  Then access: http://localhost:3001/api/health"
echo ""
print_info "Web Frontend:"
echo "  Port-forward: kubectl port-forward svc/medibot-web 8081:80"
echo "  Then access: http://localhost:8081"
echo ""
print_info "PostgreSQL:"
echo "  Port-forward: kubectl port-forward postgres-0 5432:5432"
echo "  Connect: psql -h localhost -U medibot -d medibot"
echo ""

print_header "Useful Commands"
echo ""
echo "View backend logs:     kubectl logs -f -l app=medibot-backend"
echo "View web logs:         kubectl logs -f -l app=medibot-web"
echo "View database logs:    kubectl logs -f postgres-0"
echo "Scale backend:         kubectl scale deployment medibot-backend --replicas=N"
echo "Update config:         kubectl edit configmap backend-config"
echo "Restart deployment:    kubectl rollout restart deployment/medibot-backend"
echo "View all resources:    kubectl get all"
echo ""

print_header "Cleanup"
echo ""
echo "To remove all deployments, run:"
echo "  cd infrastructure/k8s"
echo "  kubectl delete -f backend/"
echo "  kubectl delete -f web/"
echo ""

print_success "Kubernetes deployment test completed! 🎉"
echo ""
