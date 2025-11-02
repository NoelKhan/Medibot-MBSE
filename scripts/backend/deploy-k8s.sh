#!/bin/bash

# ============================================
# MediBot Backend - Kubernetes Deployment
# ============================================
# Helper script to deploy to Kubernetes cluster

set -e

# Configuration
NAMESPACE="medibot"
DEPLOYMENT_NAME="medibot-backend"
IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/noelkhan}"
IMAGE_NAME="medibot-backend"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🚀 Deploying MediBot Backend to Kubernetes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Namespace: $NAMESPACE"
echo "Image: $IMAGE_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install it first."
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster."
    exit 1
fi

echo "✅ Connected to cluster: $(kubectl config current-context)"
echo ""

# Create namespace if it doesn't exist
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "📦 Creating namespace: $NAMESPACE"
    kubectl create namespace $NAMESPACE
else
    echo "✅ Namespace $NAMESPACE already exists"
fi

# Create secrets from .env file
echo ""
echo "🔐 Creating Kubernetes secrets..."
if [ -f .env.production ]; then
    kubectl create secret generic medibot-secrets \
        --from-env-file=.env.production \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    echo "✅ Secrets created/updated"
else
    echo "⚠️  .env.production not found. Skipping secrets creation."
fi

# Apply Kubernetes manifests
echo ""
echo "📝 Applying Kubernetes manifests..."
kubectl apply -f k8s/ --namespace=$NAMESPACE

# Wait for deployment to be ready
echo ""
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/$DEPLOYMENT_NAME --namespace=$NAMESPACE --timeout=5m

# Get service URL
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Service info:"
kubectl get service $DEPLOYMENT_NAME --namespace=$NAMESPACE

echo ""
echo "Pods:"
kubectl get pods --namespace=$NAMESPACE -l app=$DEPLOYMENT_NAME

echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/$DEPLOYMENT_NAME --namespace=$NAMESPACE"
echo ""
echo "To run migrations:"
echo "  kubectl exec -it deployment/$DEPLOYMENT_NAME --namespace=$NAMESPACE -- npm run migration:run"
