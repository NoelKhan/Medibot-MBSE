#!/bin/bash

# ============================================
# MediBot Kubernetes Quick Start Script
# ============================================
# This script automates the deployment of MediBot to a local Kubernetes cluster

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}==>${NC} $1"
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker Desktop."
    exit 1
fi
print_success "Docker is installed"

if ! command_exists kubectl; then
    print_error "kubectl is not installed. Run: brew install kubectl"
    exit 1
fi
print_success "kubectl is installed"

if ! command_exists minikube && ! command_exists kind; then
    print_error "Neither minikube nor kind is installed. Please install one of them."
    echo "  Minikube: brew install minikube"
    echo "  Kind: brew install kind"
    exit 1
fi

# Choose cluster type
if command_exists minikube; then
    CLUSTER_TYPE="minikube"
    print_success "Using Minikube"
elif command_exists kind; then
    CLUSTER_TYPE="kind"
    print_success "Using Kind"
fi

# Check if images are built
print_status "Checking Docker images..."
if ! docker images | grep -q "medibot-backend.*latest"; then
    print_warning "Backend image not found. Building..."
    cd ../medibot-backend
    docker build -t medibot-backend:latest .
    cd ../k8s
fi
print_success "Backend image ready"

if ! docker images | grep -q "medibot-web.*latest"; then
    print_warning "Web image not found. Building..."
    cd ..
    docker build -f medibot-web/Dockerfile -t medibot-web:latest .
    cd k8s
fi
print_success "Web image ready"

# Start cluster
if [ "$CLUSTER_TYPE" = "minikube" ]; then
    print_status "Starting Minikube cluster..."
    
    if minikube status >/dev/null 2>&1; then
        print_warning "Minikube is already running"
    else
        minikube start --cpus=4 --memory=8192 --driver=docker
        print_success "Minikube started"
    fi
    
    print_status "Enabling Minikube addons..."
    minikube addons enable ingress
    minikube addons enable metrics-server
    print_success "Addons enabled"
    
    print_status "Loading Docker images into Minikube..."
    minikube image load medibot-backend:latest
    minikube image load medibot-web:latest
    print_success "Images loaded"
    
    # Get minikube IP for hosts file
    MINIKUBE_IP=$(minikube ip)
    print_status "Minikube IP: $MINIKUBE_IP"
    
else
    # Kind cluster
    print_status "Starting Kind cluster..."
    
    if kind get clusters | grep -q "^medibot$"; then
        print_warning "Kind cluster 'medibot' already exists"
    else
        kind create cluster --name medibot --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 8080
    protocol: TCP
  - containerPort: 443
    hostPort: 8443
    protocol: TCP
EOF
        print_success "Kind cluster created"
    fi
    
    print_status "Loading Docker images into Kind..."
    kind load docker-image medibot-backend:latest --name medibot
    kind load docker-image medibot-web:latest --name medibot
    print_success "Images loaded"
    
    print_status "Installing ingress controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    
    print_status "Waiting for ingress controller..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=90s
    print_success "Ingress controller ready"
fi

# Deploy application
print_status "Deploying PostgreSQL..."
kubectl apply -f postgres-statefulset.yaml

print_status "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod/postgres-0 --timeout=120s
sleep 5  # Extra time for PostgreSQL to fully initialize
print_success "PostgreSQL is running"

print_status "Deploying backend..."
kubectl apply -f backend-deployment.yaml

print_status "Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=medibot-backend --timeout=120s
sleep 3
print_success "Backend is running"

print_status "Running database migrations..."
POD=$(kubectl get pods -l app=medibot-backend -o jsonpath='{.items[0].metadata.name}')
if kubectl exec -it $POD -- npm run migration:run; then
    print_success "Migrations completed"
else
    print_warning "Migrations may have failed or already run"
fi

print_status "Deploying web frontend..."
kubectl apply -f web-deployment.yaml

print_status "Waiting for web to be ready..."
kubectl wait --for=condition=ready pod -l app=medibot-web --timeout=120s
print_success "Web frontend is running"

print_status "Deploying ingress..."
kubectl apply -f ingress.yaml
print_success "Ingress deployed"

print_status "Deploying horizontal pod autoscaler..."
kubectl apply -f hpa.yaml
print_success "HPA deployed"

# Configure hosts file
print_status "Configuring /etc/hosts..."
if grep -q "medibot.local" /etc/hosts; then
    print_warning "/etc/hosts already contains medibot.local entry"
else
    if [ "$CLUSTER_TYPE" = "minikube" ]; then
        echo "$MINIKUBE_IP medibot.local" | sudo tee -a /etc/hosts
    else
        echo "127.0.0.1 medibot.local" | sudo tee -a /etc/hosts
    fi
    print_success "/etc/hosts configured"
fi

# Display status
echo ""
echo "============================================"
print_success "MediBot deployed successfully!"
echo "============================================"
echo ""
kubectl get pods
echo ""
kubectl get svc
echo ""
kubectl get ingress
echo ""

# Display access URLs
echo "============================================"
echo -e "${GREEN}Access URLs:${NC}"
echo "============================================"
if [ "$CLUSTER_TYPE" = "minikube" ]; then
    echo "Web UI:        http://medibot.local"
    echo "API:           http://medibot.local/api"
    echo "Health Check:  http://medibot.local/api/health"
else
    echo "Web UI:        http://localhost:8080"
    echo "               http://medibot.local:8080 (after adding to /etc/hosts)"
    echo "API:           http://localhost:8080/api"
    echo "Health Check:  http://localhost:8080/api/health"
fi
echo ""

# Test health endpoint
print_status "Testing health endpoint..."
sleep 5

if [ "$CLUSTER_TYPE" = "minikube" ]; then
    if curl -f -s http://medibot.local/api/health >/dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed. The application may still be starting."
        echo "Wait a few seconds and try: curl http://medibot.local/api/health"
    fi
else
    if curl -f -s http://localhost:8080/api/health >/dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed. The application may still be starting."
        echo "Wait a few seconds and try: curl http://localhost:8080/api/health"
    fi
fi

echo ""
echo "============================================"
echo -e "${BLUE}Useful Commands:${NC}"
echo "============================================"
echo "View logs:            kubectl logs -f -l app=medibot-backend"
echo "Scale backend:        kubectl scale deployment medibot-backend --replicas=3"
echo "Check HPA:            kubectl get hpa"
echo "Access PostgreSQL:    kubectl exec -it postgres-0 -- psql -U medibot -d medibot"
echo "Delete everything:    kubectl delete -f ."
echo ""

if [ "$CLUSTER_TYPE" = "minikube" ]; then
    echo "Minikube dashboard:   minikube dashboard"
    echo "Stop Minikube:        minikube stop"
    echo "Delete cluster:       minikube delete"
else
    echo "Delete cluster:       kind delete cluster --name medibot"
fi

echo ""
print_success "Deployment complete! 🎉"
