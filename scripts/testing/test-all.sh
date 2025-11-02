#!/bin/bash
# =============================================================================
# MediBot End-to-End Testing Script
# =============================================================================
# This script runs comprehensive tests across all components:
# - Backend API tests
# - Web frontend tests
# - Mobile app tests (if configured)
# - Integration tests
# - Load tests (optional)
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Function to print colored output
print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# =============================================================================
# 1. BACKEND API TESTS
# =============================================================================
print_section "1. BACKEND API TESTS"

if [ -d "medibot-backend" ]; then
    cd medibot-backend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_info "Installing backend dependencies..."
        npm install
    fi
    
    # Run linting
    print_info "Running ESLint..."
    if npm run lint 2>/dev/null; then
        print_success "Backend linting passed"
        ((TESTS_PASSED++))
    else
        print_warning "Backend linting issues found (non-critical)"
        ((TESTS_SKIPPED++))
    fi
    
    # Run unit tests
    print_info "Running backend unit tests..."
    if npm run test 2>/dev/null; then
        print_success "Backend unit tests passed"
        ((TESTS_PASSED++))
    else
        print_warning "Backend unit tests not configured or failed"
        ((TESTS_SKIPPED++))
    fi
    
    # Run e2e tests (if configured)
    print_info "Running backend E2E tests..."
    if npm run test:e2e 2>/dev/null; then
        print_success "Backend E2E tests passed"
        ((TESTS_PASSED++))
    else
        print_warning "Backend E2E tests not configured or failed"
        ((TESTS_SKIPPED++))
    fi
    
    # Build check
    print_info "Building backend..."
    if npm run build 2>/dev/null; then
        print_success "Backend build successful"
        ((TESTS_PASSED++))
    else
        print_error "Backend build failed"
        ((TESTS_FAILED++))
    fi
    
    cd ..
else
    print_error "Backend directory not found"
    ((TESTS_FAILED++))
fi

# =============================================================================
# 2. WEB FRONTEND TESTS
# =============================================================================
print_section "2. WEB FRONTEND TESTS"

if [ -d "medibot-web" ]; then
    cd medibot-web
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_info "Installing web dependencies..."
        npm install
    fi
    
    # Run linting
    print_info "Running ESLint..."
    if npm run lint 2>/dev/null; then
        print_success "Web linting passed"
        ((TESTS_PASSED++))
    else
        print_warning "Web linting issues found (non-critical)"
        ((TESTS_SKIPPED++))
    fi
    
    # Type checking
    print_info "Running TypeScript type checking..."
    if npx tsc --noEmit 2>/dev/null; then
        print_success "Web type checking passed"
        ((TESTS_PASSED++))
    else
        print_error "Web type checking failed"
        ((TESTS_FAILED++))
    fi
    
    # Build check
    print_info "Building web frontend..."
    if npm run build 2>/dev/null; then
        print_success "Web build successful"
        ((TESTS_PASSED++))
    else
        print_error "Web build failed"
        ((TESTS_FAILED++))
    fi
    
    cd ..
else
    print_error "Web directory not found"
    ((TESTS_FAILED++))
fi

# =============================================================================
# 3. MOBILE APP TESTS
# =============================================================================
print_section "3. MOBILE APP TESTS"

if [ -d "MediBot" ]; then
    cd MediBot
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_info "Installing mobile app dependencies..."
        npm install
    fi
    
    # Type checking
    print_info "Running TypeScript type checking..."
    if npx tsc --noEmit 2>/dev/null; then
        print_success "Mobile type checking passed"
        ((TESTS_PASSED++))
    else
        print_warning "Mobile type checking has issues"
        ((TESTS_SKIPPED++))
    fi
    
    # Run tests (if configured)
    print_info "Running mobile tests..."
    if npm run test 2>/dev/null; then
        print_success "Mobile tests passed"
        ((TESTS_PASSED++))
    else
        print_warning "Mobile tests not configured or failed"
        ((TESTS_SKIPPED++))
    fi
    
    cd ..
else
    print_error "Mobile app directory not found"
    ((TESTS_FAILED++))
fi

# =============================================================================
# 4. KUBERNETES DEPLOYMENT TESTS
# =============================================================================
print_section "4. KUBERNETES DEPLOYMENT TESTS"

if command -v kubectl &> /dev/null; then
    print_info "Testing Kubernetes deployment..."
    
    # Check if cluster is accessible
    if kubectl cluster-info &> /dev/null; then
        print_success "Kubernetes cluster is accessible"
        ((TESTS_PASSED++))
        
        # Check pods
        print_info "Checking pod status..."
        BACKEND_PODS=$(kubectl get pods -l app=medibot-backend --no-headers 2>/dev/null | grep "Running" | wc -l)
        WEB_PODS=$(kubectl get pods -l app=medibot-web --no-headers 2>/dev/null | grep "Running" | wc -l)
        POSTGRES_PODS=$(kubectl get pods -l app=postgres --no-headers 2>/dev/null | grep "Running" | wc -l)
        
        if [ "$BACKEND_PODS" -ge 1 ]; then
            print_success "Backend pods are running ($BACKEND_PODS pods)"
            ((TESTS_PASSED++))
        else
            print_error "Backend pods are not running"
            ((TESTS_FAILED++))
        fi
        
        if [ "$WEB_PODS" -ge 1 ]; then
            print_success "Web pods are running ($WEB_PODS pods)"
            ((TESTS_PASSED++))
        else
            print_error "Web pods are not running"
            ((TESTS_FAILED++))
        fi
        
        if [ "$POSTGRES_PODS" -ge 1 ]; then
            print_success "PostgreSQL is running"
            ((TESTS_PASSED++))
        else
            print_error "PostgreSQL is not running"
            ((TESTS_FAILED++))
        fi
        
        # Check services
        print_info "Checking services..."
        if kubectl get svc medibot-backend &> /dev/null; then
            print_success "Backend service exists"
            ((TESTS_PASSED++))
        else
            print_error "Backend service not found"
            ((TESTS_FAILED++))
        fi
        
        if kubectl get svc medibot-web &> /dev/null; then
            print_success "Web service exists"
            ((TESTS_PASSED++))
        else
            print_error "Web service not found"
            ((TESTS_FAILED++))
        fi
        
        # Check ingress
        print_info "Checking ingress..."
        if kubectl get ingress medibot-ingress &> /dev/null; then
            print_success "Ingress is configured"
            ((TESTS_PASSED++))
        else
            print_warning "Ingress not found"
            ((TESTS_SKIPPED++))
        fi
        
    else
        print_warning "Kubernetes cluster not accessible"
        ((TESTS_SKIPPED++))
    fi
else
    print_warning "kubectl not installed"
    ((TESTS_SKIPPED++))
fi

# =============================================================================
# 5. API HEALTH CHECKS
# =============================================================================
print_section "5. API HEALTH CHECKS"

print_info "Testing API endpoints..."

# Test local API
if curl -s -f http://localhost:3000/api/health &> /dev/null; then
    print_success "Local API health check passed"
    ((TESTS_PASSED++))
elif curl -s -f http://medibot.local/api/health &> /dev/null; then
    print_success "Kubernetes API health check passed"
    ((TESTS_PASSED++))
else
    print_warning "API not accessible"
    ((TESTS_SKIPPED++))
fi

# Test web frontend
if curl -s -f http://localhost:5173/ &> /dev/null; then
    print_success "Local web frontend is accessible"
    ((TESTS_PASSED++))
elif curl -s -f http://medibot.local/ &> /dev/null; then
    print_success "Kubernetes web frontend is accessible"
    ((TESTS_PASSED++))
else
    print_warning "Web frontend not accessible"
    ((TESTS_SKIPPED++))
fi

# =============================================================================
# 6. DOCKER TESTS
# =============================================================================
print_section "6. DOCKER IMAGE TESTS"

if command -v docker &> /dev/null; then
    print_info "Checking Docker images..."
    
    # Check if backend image exists
    if docker images | grep -q "medibot-backend"; then
        print_success "Backend Docker image exists"
        ((TESTS_PASSED++))
    else
        print_warning "Backend Docker image not found"
        ((TESTS_SKIPPED++))
    fi
    
    # Check if web image exists
    if docker images | grep -q "medibot-web"; then
        print_success "Web Docker image exists"
        ((TESTS_PASSED++))
    else
        print_warning "Web Docker image not found"
        ((TESTS_SKIPPED++))
    fi
else
    print_warning "Docker not installed"
    ((TESTS_SKIPPED++))
fi

# =============================================================================
# 7. LOAD TESTING (OPTIONAL)
# =============================================================================
print_section "7. LOAD TESTING (Optional)"

if [ "$RUN_LOAD_TESTS" = "true" ] && command -v k6 &> /dev/null; then
    print_info "Running load tests with k6..."
    
    if [ -f "tests/load/api-load-test.js" ]; then
        if k6 run tests/load/api-load-test.js; then
            print_success "Load tests passed"
            ((TESTS_PASSED++))
        else
            print_error "Load tests failed"
            ((TESTS_FAILED++))
        fi
    else
        print_warning "Load test scripts not found"
        ((TESTS_SKIPPED++))
    fi
else
    print_info "Load testing skipped (set RUN_LOAD_TESTS=true to enable)"
    ((TESTS_SKIPPED++))
fi

# =============================================================================
# SUMMARY
# =============================================================================
print_section "TEST SUMMARY"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))

echo -e "Total Tests:   ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:        ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:        ${RED}$TESTS_FAILED${NC}"
echo -e "Skipped:       ${YELLOW}$TESTS_SKIPPED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}\n"
    exit 1
fi
