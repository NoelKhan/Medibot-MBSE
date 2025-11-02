#!/bin/bash

# MediBot Mobile - OTA Update Script
# Publishes Over-The-Air updates for quick fixes without app store submission
# Usage: ./scripts/ota-update.sh [branch] [message]
# Example: ./scripts/ota-update.sh production "Fix critical bug in chat"

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}ℹ️  $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }

# Get branch and message
BRANCH=${1:-production}
MESSAGE=${2:-"OTA update $(date +%Y-%m-%d_%H:%M:%S)"}

print_info "Publishing OTA update to branch: $BRANCH"

cd "$(dirname "$0")/../MediBot"

# Check if logged in
if ! eas whoami &> /dev/null; then
    print_error "Not logged in to Expo. Please run: eas login"
    exit 1
fi

# Run quick checks
print_info "Running quick checks..."
npx tsc --noEmit || print_warn "Type check had errors, but continuing..."

# Publish update
print_info "Publishing update..."
eas update --branch $BRANCH --message "$MESSAGE"

print_success "OTA update published successfully!"
print_info "Users will receive the update on next app restart"
print_info "View updates at: https://expo.dev/accounts/your-account/projects/medibot/updates"
