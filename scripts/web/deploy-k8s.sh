#!/bin/bash

# ============================================
# MediBot Web - Kubernetes Deployment Script
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 MediBot Web - Kubernetes Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$ROOT_DIR/k8s/web"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗${NC} kubectl not found. Please install kubectl first."
    exit 1
fi

echo -e "${GREEN}✓${NC} kubectl found"

# Check kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}✗${NC} Cannot connect to Kubernetes cluster"
    echo -e "${YELLOW}⚠${NC} Please configure kubectl first"
    exit 1
fi

echo -e "${GREEN}✓${NC} Connected to Kubernetes cluster"

# Deploy ConfigMap
echo -e "\n${YELLOW}📝 Deploying ConfigMap...${NC}"
kubectl apply -f "$K8S_DIR/web-configmap.yaml"
echo -e "${GREEN}✓${NC} ConfigMap deployed"

# Deploy Deployment
echo -e "\n${YELLOW}🚀 Deploying Application...${NC}"
kubectl apply -f "$K8S_DIR/web-deployment.yaml"
echo -e "${GREEN}✓${NC} Deployment created"

# Deploy Service
echo -e "\n${YELLOW}🌐 Creating Service...${NC}"
kubectl apply -f "$K8S_DIR/web-service.yaml"
echo -e "${GREEN}✓${NC} Service created"

# Deploy Ingress
echo -e "\n${YELLOW}🔗 Creating Ingress...${NC}"
kubectl apply -f "$K8S_DIR/web-ingress.yaml"
echo -e "${GREEN}✓${NC} Ingress created"

# Deploy HPA
echo -e "\n${YELLOW}📊 Creating Horizontal Pod Autoscaler...${NC}"
kubectl apply -f "$K8S_DIR/web-hpa.yaml"
echo -e "${GREEN}✓${NC} HPA created"

# Wait for deployment
echo -e "\n${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
kubectl rollout status deployment/medibot-web -n default --timeout=5m

# Get deployment status
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Show status
echo -e "${BLUE}📊 Deployment Status:${NC}"
kubectl get deployment medibot-web -n default

echo -e "\n${BLUE}🔍 Pods:${NC}"
kubectl get pods -l app=medibot-web -n default

echo -e "\n${BLUE}🌐 Service:${NC}"
kubectl get svc medibot-web -n default

echo -e "\n${BLUE}🔗 Ingress:${NC}"
kubectl get ingress medibot-web-ingress -n default

echo -e "\n${BLUE}📊 HPA:${NC}"
kubectl get hpa medibot-web-hpa -n default

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ MediBot Web is now running!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "  View logs:    kubectl logs -f deployment/medibot-web -n default"
echo -e "  Scale up:     kubectl scale deployment/medibot-web --replicas=5 -n default"
echo -e "  Restart:      kubectl rollout restart deployment/medibot-web -n default"
echo -e "  Delete:       kubectl delete -f $K8S_DIR/"
echo ""
