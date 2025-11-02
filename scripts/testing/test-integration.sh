#!/bin/bash
# MediBot Integration Testing Script
# Tests AI Agent → Backend → Services flow

echo "🧪 MediBot Integration Testing"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
PASSED=0
FAILED=0

# Function to test AI Agent directly
test_ai_agent() {
    local TEST_NAME="$1"
    local MESSAGE="$2"
    local EXPECTED_SEVERITY="$3"
    
    echo -e "${BLUE}Test: $TEST_NAME${NC}"
    echo "Message: $MESSAGE"
    echo "Expected Severity: $EXPECTED_SEVERITY"
    
    RESPONSE=$(curl -s -X POST http://localhost:8000/api/chat \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"$MESSAGE\", \"user_id\": \"test-user\"}")
    
    if [ $? -eq 0 ]; then
        SEVERITY=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('triage', {}).get('severity_level', 'UNKNOWN'))" 2>/dev/null)
        
        if [ "$SEVERITY" == "$EXPECTED_SEVERITY" ]; then
            echo -e "${GREEN}✅ PASS${NC} - Got $SEVERITY severity"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ FAIL${NC} - Expected $EXPECTED_SEVERITY, got $SEVERITY"
            FAILED=$((FAILED + 1))
        fi
        
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
    else
        echo -e "${RED}❌ FAIL${NC} - AI Agent not responding"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
    echo "---"
    echo ""
}

# Check if services are running
echo "📋 Checking Service Status..."
echo ""

# AI Agent
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AI Agent (8000)${NC}"
else
    echo -e "${RED}❌ AI Agent not running on port 8000${NC}"
    exit 1
fi

# Backend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend (3000)${NC}"
else
    echo -e "${RED}❌ Backend not running on port 3000${NC}"
    exit 1
fi

# Ollama
if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama (11434)${NC}"
else
    echo -e "${RED}❌ Ollama not running on port 11434${NC}"
    exit 1
fi

echo ""
echo "================================"
echo "Starting AI Agent Tests..."
echo "================================"
echo ""

# Test 1: RED case - Emergency
test_ai_agent \
    "RED Case - Emergency" \
    "I have severe chest pain and difficulty breathing for 30 minutes" \
    "RED"

# Test 2: AMBER case - Booking needed
test_ai_agent \
    "AMBER Case - Consultation Needed" \
    "I have a persistent cough and mild fever for 3 days" \
    "AMBER"

# Test 3: GREEN case - Self-care
test_ai_agent \
    "GREEN Case - Self-Care" \
    "I have a mild headache" \
    "GREEN"

# Test 4: RED case - Another emergency symptom
test_ai_agent \
    "RED Case - Stroke Symptoms" \
    "I have sudden numbness on my left side and slurred speech" \
    "RED"

# Test 5: AMBER case - Persistent symptoms
test_ai_agent \
    "AMBER Case - Skin Issue" \
    "I have a rash that has been spreading for 2 days" \
    "AMBER"

# Summary
echo "================================"
echo "Test Results Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
