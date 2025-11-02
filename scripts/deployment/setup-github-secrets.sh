#!/bin/bash

# Setup GitHub Secrets for MediBot CI/CD
# This script will guide you through adding all required secrets

set -e

REPO="NoelKhan/MediBot"

echo "🔐 GitHub Secrets Setup for MediBot CI/CD"
echo "=========================================="
echo ""
echo "This script will help you add the following secrets to your GitHub repository:"
echo "  1. EXPO_TOKEN - For Expo EAS builds"
echo "  2. DOCKER_USERNAME - For Docker Hub (optional for now)"
echo "  3. DOCKER_PASSWORD - For Docker Hub (optional for now)"
echo "  4. KUBE_CONFIG - For Kubernetes deployment (optional for now)"
echo ""

# Check if gh CLI is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated as $(gh api user -q .login)"
echo ""

# Function to add secret
add_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=$3
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Setting up: $secret_name"
    echo "Description: $secret_description"
    echo ""
    
    if [ "$is_required" = "optional" ]; then
        read -p "Do you want to add $secret_name now? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "⏭️  Skipping $secret_name (you can add it later)"
            echo ""
            return
        fi
    fi
    
    read -sp "Enter value for $secret_name: " secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  No value entered, skipping..."
        echo ""
        return
    fi
    
    # Add secret using gh CLI
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO"
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully added $secret_name"
    else
        echo "❌ Failed to add $secret_name"
    fi
    echo ""
}

# Add EXPO_TOKEN (Required)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  EXPO_TOKEN (REQUIRED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 How to get your EXPO_TOKEN:"
echo "   1. Open: https://expo.dev/accounts/noel5khan/settings/access-tokens"
echo "   2. Click 'Create Token'"
echo "   3. Give it a name: 'GitHub Actions CI/CD'"
echo "   4. Select scope: 'All permissions'"
echo "   5. Click 'Create Token'"
echo "   6. Copy the token (it will only be shown once!)"
echo ""
echo "🌐 Opening Expo access tokens page in browser..."
sleep 2

add_secret "EXPO_TOKEN" "Expo access token for EAS builds" "required"

# Add DOCKER_USERNAME (Optional)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  DOCKER_USERNAME (Optional - for Kubernetes deployment)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Your Docker Hub username (create account at hub.docker.com if needed)"
echo "   You can skip this for now if you're not deploying to Kubernetes yet."
echo ""

add_secret "DOCKER_USERNAME" "Docker Hub username" "optional"

# Add DOCKER_PASSWORD (Optional)
if gh secret list --repo "$REPO" 2>/dev/null | grep -q "DOCKER_USERNAME"; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "3️⃣  DOCKER_PASSWORD (Optional - for Kubernetes deployment)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📌 Your Docker Hub password or access token"
    echo ""
    
    add_secret "DOCKER_PASSWORD" "Docker Hub password or access token" "optional"
fi

# Add KUBE_CONFIG (Optional)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  KUBE_CONFIG (Optional - for Kubernetes deployment)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Your Kubernetes config file (base64 encoded)"
echo "   Run this command to get the value:"
echo "   cat ~/.kube/config | base64 | tr -d '\\n'"
echo ""
echo "   You can skip this for now if you're not deploying to Kubernetes yet."
echo ""

add_secret "KUBE_CONFIG" "Kubernetes config (base64 encoded)" "optional"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Setup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Checking configured secrets..."
echo ""

gh secret list --repo "$REPO"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GitHub Secrets Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Test GitHub Actions workflow:"
echo "   git add ."
echo "   git commit -m \"ci: test GitHub Actions workflow\""
echo "   git push origin MEDIBOT-1/architecture-fix"
echo ""
echo "2. Watch the workflow run:"
echo "   https://github.com/NoelKhan/MediBot/actions"
echo ""
echo "3. Or test manual deployment:"
echo "   ./scripts/deploy.sh preview"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
