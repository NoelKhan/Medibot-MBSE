#!/bin/bash

# ============================================
# Kubernetes Deployment Verification
# ============================================

set -e

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

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header "Kubernetes Deployment Status"

# Check cluster
print_info "Cluster: $(kubectl config current-context)"
echo ""

# Show all resources
print_header "All Resources"
kubectl get all

echo ""
print_header "Pods Details"
kubectl get pods -o wide

echo ""
print_header "Services"
kubectl get svc

echo ""
print_header "Ingress"
kubectl get ingress 2>/dev/null || echo "No ingress configured"

echo ""
print_header "ConfigMaps"
kubectl get configmap | grep medibot || echo "No medibot configmaps"

echo ""
print_header "Secrets"
kubectl get secret | grep medibot || echo "No medibot secrets"

echo ""
print_header "Pod Resource Usage"
kubectl top pods 2>/dev/null || print_info "Metrics server not installed"

echo ""
print_header "Testing Services"

# Test backend
print_info "Testing backend service..."
kubectl run test-backend --rm -i --restart=Never --image=curlimages/curl:latest -- \
  curl -s http://medibot-backend:3000/api/health && \
  print_success "Backend health check passed" || \
  print_error "Backend health check failed"

# Test web
print_info "Testing web service..."
kubectl run test-web --rm -i --restart=Never --image=curlimages/curl:latest -- \
  curl -s -o /dev/null -w "%{http_code}" http://medibot-web && \
  print_success "Web frontend is accessible" || \
  print_error "Web frontend is not accessible"

# Test database
print_info "Testing PostgreSQL..."
kubectl exec postgres-0 -- pg_isready -U medibot && \
  print_success "PostgreSQL is ready" || \
  print_error "PostgreSQL is not ready"

echo ""
print_header "Recent Logs"

echo ""
print_info "Backend logs (last 10 lines):"
kubectl logs -l app=medibot-backend --tail=10 | tail -10

echo ""
print_info "Web logs (last 10 lines):"
kubectl logs -l app=medibot-web --tail=10 | tail -10

echo ""
print_header "Access Instructions"

echo ""
print_info "To access the backend API:"
echo "  kubectl port-forward svc/medibot-backend 3001:3000"
echo "  curl http://localhost:3001/api/health"

echo ""
print_info "To access the web frontend:"
echo "  kubectl port-forward svc/medibot-web 8081:80"
echo "  open http://localhost:8081"

echo ""
print_info "To access PostgreSQL:"
echo "  kubectl port-forward postgres-0 5432:5432"
echo "  psql -h localhost -U medibot -d medibot"

echo ""
print_header "Summary"

BACKEND_READY=$(kubectl get pods -l app=medibot-backend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
WEB_READY=$(kubectl get pods -l app=medibot-web -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
POSTGRES_READY=$(kubectl get pods -l app=postgres -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)

echo ""
print_success "$BACKEND_READY backend pods are ready"
print_success "$WEB_READY web pods are ready"
print_success "$POSTGRES_READY database pods are ready"

echo ""
print_info "Deployment verification complete! 🎉"
echo ""
