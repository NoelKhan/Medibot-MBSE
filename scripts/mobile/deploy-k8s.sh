#!/bin/bash

# MediBot Mobile Kubernetes Deployment Script
# Usage: ./scripts/deploy-k8s.sh [version]
# Example: ./scripts/deploy-k8s.sh v1.0.0

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}ℹ️  $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }

# Get version tag
VERSION=${1:-latest}
DOCKER_IMAGE="your-docker-username/medibot-mobile:$VERSION"

print_info "Starting Kubernetes deployment..."

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    print_error "kubectl is not configured or cluster is not reachable"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace medibot &> /dev/null; then
    print_warn "Namespace 'medibot' not found. Creating..."
    kubectl create namespace medibot
fi

# Change to project root
cd "$(dirname "$0")/.."

# Build Docker image
print_info "Building Docker image..."
cd MediBot
docker build -t $DOCKER_IMAGE -f Dockerfile.web .

# Push to registry
print_info "Pushing Docker image to registry..."
docker push $DOCKER_IMAGE

# Update Kubernetes deployment
print_info "Updating Kubernetes deployment..."
kubectl apply -f ../infrastructure/k8s/mobile-deployment.yaml

# Set the new image
print_info "Setting new image: $DOCKER_IMAGE"
kubectl set image deployment/medibot-mobile \
    medibot-mobile=$DOCKER_IMAGE \
    --namespace=medibot

# Wait for rollout
print_info "Waiting for rollout to complete..."
kubectl rollout status deployment/medibot-mobile --namespace=medibot --timeout=5m

# Verify deployment
print_info "Verifying deployment..."
kubectl get pods -l app=medibot-mobile --namespace=medibot
kubectl get services -l app=medibot-mobile --namespace=medibot

# Get the service URL
SERVICE_IP=$(kubectl get service medibot-mobile --namespace=medibot -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$SERVICE_IP" ]; then
    SERVICE_IP=$(kubectl get service medibot-mobile --namespace=medibot -o jsonpath='{.spec.clusterIP}')
fi

print_success "Deployment completed successfully!"
print_info "Service is available at: http://$SERVICE_IP"
print_info "You can access it via the configured Ingress: https://mobile.medibot.com"

# Run health check
print_info "Running health check..."
sleep 5
if kubectl exec -n medibot deployment/medibot-mobile -- wget -qO- http://localhost/health | grep -q "healthy"; then
    print_success "Health check passed!"
else
    print_warn "Health check failed. Please check the logs:"
    print_info "kubectl logs -l app=medibot-mobile --namespace=medibot"
fi
