#!/bin/bash
# =============================================================================
# MediBot Project - Quick Status Check
# =============================================================================
# Run this script to quickly verify all components are working
# =============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 MediBot - Quick Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found - skipping Kubernetes checks"
else
    echo "📦 Kubernetes Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check cluster
    if kubectl cluster-info &> /dev/null; then
        echo "✅ Cluster is accessible"
        
        # Check pods
        echo ""
        echo "Pods:"
        kubectl get pods -l app=medibot-backend -o wide 2>/dev/null | tail -n +2 | while read line; do
            if echo "$line" | grep -q "Running"; then
                echo "  ✅ Backend: $line"
            else
                echo "  ⚠️  Backend: $line"
            fi
        done
        
        kubectl get pods -l app=medibot-web -o wide 2>/dev/null | tail -n +2 | while read line; do
            if echo "$line" | grep -q "Running"; then
                echo "  ✅ Web: $line"
            else
                echo "  ⚠️  Web: $line"
            fi
        done
        
        kubectl get pods -l app=postgres -o wide 2>/dev/null | tail -n +2 | while read line; do
            if echo "$line" | grep -q "Running"; then
                echo "  ✅ PostgreSQL: $line"
            else
                echo "  ⚠️  PostgreSQL: $line"
            fi
        done
        
        # Check services
        echo ""
        echo "Services:"
        if kubectl get svc medibot-backend &> /dev/null; then
            BACKEND_IP=$(kubectl get svc medibot-backend -o jsonpath='{.spec.clusterIP}')
            echo "  ✅ Backend API: $BACKEND_IP:3000"
        fi
        
        if kubectl get svc medibot-web &> /dev/null; then
            WEB_IP=$(kubectl get svc medibot-web -o jsonpath='{.spec.clusterIP}')
            echo "  ✅ Web Frontend: $WEB_IP:80"
        fi
        
        # Check ingress
        echo ""
        echo "Ingress:"
        if kubectl get ingress medibot-ingress &> /dev/null; then
            echo "  ✅ Ingress configured: http://medibot.local"
        fi
        
    else
        echo "❌ Cluster not accessible"
    fi
fi

echo ""
echo "🌐 API Health Checks:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check local API
if curl -s -f http://localhost:3000/api/health &> /dev/null; then
    RESPONSE=$(curl -s http://localhost:3000/api/health)
    echo "✅ Local API: http://localhost:3000/api/health"
    echo "   Status: $(echo $RESPONSE | jq -r '.status' 2>/dev/null || echo 'ok')"
elif curl -s -f http://medibot.local/api/health &> /dev/null; then
    RESPONSE=$(curl -s http://medibot.local/api/health)
    echo "✅ K8s API: http://medibot.local/api/health"
    echo "   Status: $(echo $RESPONSE | jq -r '.status' 2>/dev/null || echo 'ok')"
    UPTIME=$(echo $RESPONSE | jq -r '.uptime' 2>/dev/null)
    if [ ! -z "$UPTIME" ]; then
        echo "   Uptime: ${UPTIME}s"
    fi
else
    echo "⚠️  API not accessible"
fi

# Check web frontend
if curl -s -f http://localhost:5173/ &> /dev/null; then
    echo "✅ Local Web: http://localhost:5173/"
elif curl -s -f http://medibot.local/ &> /dev/null; then
    echo "✅ K8s Web: http://medibot.local/"
else
    echo "⚠️  Web frontend not accessible"
fi

echo ""
echo "🐳 Docker Images:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
    if docker images | grep -q "medibot-backend"; then
        SIZE=$(docker images medibot-backend:latest --format "{{.Size}}" 2>/dev/null)
        echo "✅ Backend image: medibot-backend:latest ($SIZE)"
    else
        echo "⚠️  Backend image not found"
    fi
    
    if docker images | grep -q "medibot-web"; then
        SIZE=$(docker images medibot-web:latest --format "{{.Size}}" 2>/dev/null)
        echo "✅ Web image: medibot-web:latest ($SIZE)"
    else
        echo "⚠️  Web image not found"
    fi
else
    echo "⚠️  Docker not available"
fi

echo ""
echo "📱 Project Files:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check main directories
[ -d "medibot-backend" ] && echo "✅ Backend: medibot-backend/" || echo "❌ Backend directory missing"
[ -d "medibot-web" ] && echo "✅ Web: medibot-web/" || echo "❌ Web directory missing"
[ -d "MediBot" ] && echo "✅ Mobile: MediBot/" || echo "❌ Mobile directory missing"
[ -d "shared" ] && echo "✅ Shared: shared/" || echo "❌ Shared directory missing"
[ -d "k8s" ] && echo "✅ K8s configs: k8s/" || echo "❌ K8s directory missing"
[ -d ".github/workflows" ] && echo "✅ CI/CD: .github/workflows/" || echo "❌ CI/CD workflows missing"

echo ""
echo "📋 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "README.md" ] && echo "✅ README.md" || echo "⚠️  README.md missing"
[ -f "PROJECT-COMPLETE.md" ] && echo "✅ PROJECT-COMPLETE.md" || echo "⚠️  PROJECT-COMPLETE.md missing"
[ -f "DEPLOYMENT-GUIDE.md" ] && echo "✅ DEPLOYMENT-GUIDE.md" || echo "⚠️  DEPLOYMENT-GUIDE.md missing"
[ -f "test-all.sh" ] && echo "✅ test-all.sh" || echo "⚠️  test-all.sh missing"
[ -f "tests/load/api-load-test.js" ] && echo "✅ Load test script" || echo "⚠️  Load test script missing"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Status check complete!"
echo ""
echo "📚 Quick Links:"
echo "   • Project docs: PROJECT-COMPLETE.md"
echo "   • Deployment guide: DEPLOYMENT-GUIDE.md"
echo "   • Run tests: ./test-all.sh"
echo "   • Load tests: k6 run tests/load/api-load-test.js"
echo ""
echo "🚀 Access URLs:"
echo "   • Web: http://medibot.local/"
echo "   • API: http://medibot.local/api/health"
echo "   • Docs: http://medibot.local/api/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
