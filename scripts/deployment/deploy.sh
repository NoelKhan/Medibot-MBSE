#!/bin/bash

# MediBot Mobile Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check arguments
ENVIRONMENT=${1:-development}

if [[ ! "$ENVIRONMENT" =~ ^(development|preview|production)$ ]]; then
    print_error "Invalid environment. Use: development, preview, or production"
    exit 1
fi

print_info "Starting MediBot Mobile deployment for: $ENVIRONMENT"

# Change to MediBot directory
cd "$(dirname "$0")/../MediBot"

# Check if eas-cli is installed
if ! command -v eas &> /dev/null; then
    print_warn "EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in to Expo
print_info "Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    print_warn "Not logged in to Expo. Please login:"
    eas login
fi

# Install dependencies
print_info "Installing dependencies..."
npm ci

# Run tests
print_info "Running tests..."
npm test -- --passWithNoTests || print_warn "Tests failed, but continuing..."

# Run type check
print_info "Running TypeScript type check..."
npx tsc --noEmit || print_warn "Type check failed, but continuing..."

# Build based on environment
case $ENVIRONMENT in
    development)
        print_info "Building development APK..."
        eas build --platform android --profile development --non-interactive
        ;;
    
    preview)
        print_info "Building preview builds for both platforms..."
        eas build --platform all --profile preview --non-interactive
        ;;
    
    production)
        print_info "Building production builds..."
        
        # Build iOS
        print_info "Building iOS app..."
        eas build --platform ios --profile production --non-interactive
        
        # Build Android
        print_info "Building Android app..."
        eas build --platform android --profile production --non-interactive
        
        # Publish OTA update
        print_info "Publishing OTA update..."
        eas update --branch production --message "Deployment $(date +%Y-%m-%d_%H:%M:%S)"
        ;;
esac

print_success "Deployment initiated successfully!"
print_info "Check build status at: https://expo.dev/accounts/your-account/projects/medibot/builds"

# Optional: Deploy web version to Kubernetes
if [[ "$ENVIRONMENT" == "production" ]]; then
    read -p "Do you want to deploy web version to Kubernetes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Building and deploying web version..."
        ./scripts/deploy-k8s.sh
    fi
fi
