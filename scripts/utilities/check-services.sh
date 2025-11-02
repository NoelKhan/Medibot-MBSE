#!/bin/bash

# MediBot Service Status Checker

echo "🔍 MediBot Services Status Check"
echo "================================"
echo ""

# Check Ollama (Port 11434)
echo "1️⃣ Checking Ollama (Port 11434)..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "   ✅ Ollama is running"
    MODEL=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | head -n1 | cut -d'"' -f4)
    if [ -n "$MODEL" ]; then
        echo "   📦 Model: $MODEL"
    fi
else
    echo "   ❌ Ollama is NOT running"
    echo "   💡 Start with: ollama serve"
fi
echo ""

# Check Python AIAgent (Port 8000)
echo "2️⃣ Checking Python AIAgent (Port 8000)..."
if lsof -ti:8000 > /dev/null 2>&1; then
    PID=$(lsof -ti:8000)
    echo "   ✅ Python AIAgent is running (PID: $PID)"
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "   🏥 Health check: PASSED"
    else
        echo "   ⚠️ Health check: FAILED"
    fi
else
    echo "   ❌ Python AIAgent is NOT running"
    echo "   💡 Start with: cd medibot-backend && npm run start:dev"
fi
echo ""

# Check Backend (Port 3000)
echo "3️⃣ Checking NestJS Backend (Port 3000)..."
if lsof -ti:3000 > /dev/null 2>&1; then
    PID=$(lsof -ti:3000)
    echo "   ✅ Backend is running (PID: $PID)"
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "   🏥 Health check: PASSED"
    else
        echo "   ⚠️  Health check: No response (may require auth)"
    fi
else
    echo "   ❌ Backend is NOT running"
    echo "   💡 Start with: cd medibot-backend && npm run start:dev"
fi
echo ""

# Check Frontend (Port 5173)
echo "4️⃣ Checking React Frontend (Port 5173)..."
if lsof -ti:5173 > /dev/null 2>&1; then
    PID=$(lsof -ti:5173)
    echo "   ✅ Frontend is running (PID: $PID)"
    echo "   🌐 Open: http://localhost:5173"
else
    echo "   ❌ Frontend is NOT running"
    echo "   💡 Start with: cd medibot-web && npm run dev"
fi
echo ""

# Summary
echo "📊 Summary"
echo "=========="
OLLAMA=$(curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "✅" || echo "❌")
PYTHON=$(lsof -ti:8000 > /dev/null 2>&1 && echo "✅" || echo "❌")
BACKEND=$(lsof -ti:3000 > /dev/null 2>&1 && echo "✅" || echo "❌")
FRONTEND=$(lsof -ti:5173 > /dev/null 2>&1 && echo "✅" || echo "❌")

echo "Ollama (11434):    $OLLAMA"
echo "Python (8000):     $PYTHON"
echo "Backend (3000):    $BACKEND"
echo "Frontend (5173):   $FRONTEND"
echo ""

# Integration Flow
echo "🔗 Integration Flow"
echo "===================="
echo "Browser → Frontend (5173) → Backend (3000) → Python (8000) → Ollama (11434)"
echo "         $FRONTEND              $BACKEND            $PYTHON           $OLLAMA"
echo ""

# All services check
if [ "$OLLAMA" == "✅" ] && [ "$PYTHON" == "✅" ] && [ "$BACKEND" == "✅" ] && [ "$FRONTEND" == "✅" ]; then
    echo "🎉 All services are running! Ready to test Llama integration."
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Open: http://localhost:5173"
    echo "   2. Login as a patient"
    echo "   3. Navigate to /ai-chat"
    echo "   4. Send a message: 'I have a fever and headache'"
    echo "   5. Verify Llama response"
else
    echo "⚠️  Some services are not running. Check the status above."
    echo ""
    echo "🚀 Quick Start Commands:"
    echo "   Terminal 1: ollama serve"
    echo "   Terminal 2: cd medibot-backend && npm run start:dev"
    echo "   Terminal 3: cd medibot-web && npm run dev"
fi
