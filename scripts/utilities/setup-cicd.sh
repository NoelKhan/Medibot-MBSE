#!/bin/bash
# CI/CD Quick Setup Script
# This script helps configure GitHub Actions secrets for your MediBot deployment

set -e

echo "======================================"
echo "MediBot CI/CD Configuration Helper"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install with: brew install gh"
    echo "Then authenticate: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub first${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI is installed and authenticated${NC}"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Function to generate random secret
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

echo "======================================"
echo "Step 1: Required Secrets"
echo "======================================"
echo ""

# JWT_SECRET
echo -e "${YELLOW}[1/5] JWT_SECRET${NC}"
echo "This is used to sign authentication tokens"
read -p "Generate random JWT secret? (Y/n): " gen_jwt
if [[ $gen_jwt != "n" && $gen_jwt != "N" ]]; then
    JWT_SECRET=$(generate_secret)
    echo "Generated: $JWT_SECRET"
    gh secret set JWT_SECRET --body "$JWT_SECRET"
    echo -e "${GREEN}✓ JWT_SECRET configured${NC}"
else
    read -p "Enter JWT_SECRET: " JWT_SECRET
    gh secret set JWT_SECRET --body "$JWT_SECRET"
    echo -e "${GREEN}✓ JWT_SECRET configured${NC}"
fi
echo ""

# DATABASE_PASSWORD
echo -e "${YELLOW}[2/5] DATABASE_PASSWORD${NC}"
echo "This is used for test database in CI/CD"
read -p "Use 'test-password' for CI tests? (Y/n): " use_test_pw
if [[ $use_test_pw != "n" && $use_test_pw != "N" ]]; then
    gh secret set DATABASE_PASSWORD --body "test-password"
    echo -e "${GREEN}✓ DATABASE_PASSWORD configured${NC}"
else
    read -p "Enter DATABASE_PASSWORD: " DB_PASS
    gh secret set DATABASE_PASSWORD --body "$DB_PASS"
    echo -e "${GREEN}✓ DATABASE_PASSWORD configured${NC}"
fi
echo ""

# VITE_API_URL_PROD
echo -e "${YELLOW}[3/5] VITE_API_URL_PROD${NC}"
echo "This is the production API URL for the web app"
echo "Examples:"
echo "  - https://api.yourdomain.com"
echo "  - https://medibot-api.herokuapp.com"
echo "  - https://api.medibot.com"
read -p "Enter production API URL (or press Enter to skip): " API_URL
if [[ -n "$API_URL" ]]; then
    gh secret set VITE_API_URL_PROD --body "$API_URL"
    echo -e "${GREEN}✓ VITE_API_URL_PROD configured${NC}"
else
    echo -e "${YELLOW}⚠ Skipped - You can set this later${NC}"
fi
echo ""

# DOCKER_USERNAME
echo -e "${YELLOW}[4/5] Container Registry${NC}"
echo "Choose container registry:"
echo "1) GitHub Container Registry (ghcr.io) - Recommended"
echo "2) Docker Hub"
echo "3) Skip for now"
read -p "Select option (1-3): " registry_choice

case $registry_choice in
    1)
        echo "Using GitHub Container Registry"
        echo "No additional secrets needed - GITHUB_TOKEN is automatic"
        echo -e "${GREEN}✓ Registry configured (ghcr.io)${NC}"
        ;;
    2)
        read -p "Enter Docker Hub username: " DOCKER_USER
        read -sp "Enter Docker Hub password/token: " DOCKER_PASS
        echo ""
        gh secret set DOCKER_USERNAME --body "$DOCKER_USER"
        gh secret set DOCKER_PASSWORD --body "$DOCKER_PASS"
        echo -e "${GREEN}✓ Docker Hub credentials configured${NC}"
        ;;
    3)
        echo -e "${YELLOW}⚠ Skipped - Docker builds will not push to registry${NC}"
        ;;
esac
echo ""

# KUBECONFIG (optional)
echo -e "${YELLOW}[5/5] Kubernetes Configuration (Optional)${NC}"
echo "Only needed if deploying to Kubernetes from CI/CD"
read -p "Configure KUBECONFIG? (y/N): " setup_k8s

if [[ $setup_k8s == "y" || $setup_k8s == "Y" ]]; then
    echo "Encoding kubeconfig..."
    if [[ -f ~/.kube/config ]]; then
        KUBECONFIG_BASE64=$(cat ~/.kube/config | base64)
        gh secret set KUBECONFIG --body "$KUBECONFIG_BASE64"
        echo -e "${GREEN}✓ KUBECONFIG configured${NC}"
    else
        echo -e "${RED}Error: ~/.kube/config not found${NC}"
        echo "You can configure this manually later"
    fi
else
    echo -e "${YELLOW}⚠ Skipped - Manual deployment only${NC}"
fi
echo ""

echo "======================================"
echo "Step 2: Optional Cloud Secrets"
echo "======================================"
echo ""

read -p "Configure AWS credentials? (y/N): " setup_aws
if [[ $setup_aws == "y" || $setup_aws == "Y" ]]; then
    read -p "Enter AWS_ACCESS_KEY_ID: " AWS_KEY
    read -sp "Enter AWS_SECRET_ACCESS_KEY: " AWS_SECRET
    echo ""
    read -p "Enter AWS_ACCOUNT_ID: " AWS_ACCOUNT
    
    gh secret set AWS_ACCESS_KEY_ID --body "$AWS_KEY"
    gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET"
    gh secret set AWS_ACCOUNT_ID --body "$AWS_ACCOUNT"
    echo -e "${GREEN}✓ AWS credentials configured${NC}"
fi
echo ""

read -p "Configure GCP credentials? (y/N): " setup_gcp
if [[ $setup_gcp == "y" || $setup_gcp == "Y" ]]; then
    read -p "Enter GCP_PROJECT_ID: " GCP_PROJECT
    read -p "Enter path to service account JSON: " GCP_JSON_PATH
    
    if [[ -f "$GCP_JSON_PATH" ]]; then
        GCP_KEY=$(cat "$GCP_JSON_PATH")
        gh secret set GCP_PROJECT_ID --body "$GCP_PROJECT"
        gh secret set GCP_SERVICE_ACCOUNT_KEY --body "$GCP_KEY"
        echo -e "${GREEN}✓ GCP credentials configured${NC}"
    else
        echo -e "${RED}Error: File not found${NC}"
    fi
fi
echo ""

echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo "Configured secrets:"
gh secret list
echo ""

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review configured secrets: gh secret list"
echo "2. Push code to trigger CI/CD: git push origin main"
echo "3. Monitor workflow: gh workflow view"
echo "4. Check actions: https://github.com/$REPO/actions"
echo ""
echo "To update a secret later:"
echo "  gh secret set SECRET_NAME --body \"new-value\""
echo ""
echo "Need help? Check DEPLOYMENT_GUIDE.md"
