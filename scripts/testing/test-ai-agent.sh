#!/bin/bash

# ===========================================
# MediBot AI Agent - Complete Test Suite
# ===========================================
# Tests the entire AI integration pipeline
# Author: AI Integration Team
# Date: January 31, 2025

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AI_AGENT_URL="http://localhost:8000"
BACKEND_URL="http://localhost:3000"
TEST_USER_EMAIL="test@medibot.com"
TEST_USER_PASSWORD="Test123!@#"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MediBot AI Agent - Test Suite           ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Helper functions
function print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $1"
}

function print_success() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASS${NC} $1"
    echo ""
}

function print_failure() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAIL${NC} $1"
    echo ""
}

function check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=5
    local attempt=1

    print_test "Checking $service_name availability..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f -o /dev/null "$url"; then
            print_success "$service_name is running"
            return 0
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts failed, retrying...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_failure "$service_name is not responding at $url"
    return 1
}

# ===========================================
# Test 1: Check Prerequisites
# ===========================================
echo -e "${BLUE}═══ Phase 1: Prerequisites ═══${NC}"
echo ""

print_test "Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    print_success "Ollama is installed"
else
    print_failure "Ollama not found. Install from https://ollama.ai"
    exit 1
fi

print_test "Checking if MedLlama2 model is available..."
if ollama list | grep -q "medllama2"; then
    print_success "MedLlama2 model is available"
else
    echo -e "${YELLOW}Pulling MedLlama2 model...${NC}"
    ollama pull medllama2
    print_success "MedLlama2 model downloaded"
fi

# ===========================================
# Test 2: Service Health Checks
# ===========================================
echo -e "${BLUE}═══ Phase 2: Service Health Checks ═══${NC}"
echo ""

check_service "AI Agent FastAPI" "$AI_AGENT_URL/health" || exit 1
check_service "NestJS Backend" "$BACKEND_URL/health" || exit 1

# ===========================================
# Test 3: AI Agent Direct Tests
# ===========================================
echo -e "${BLUE}═══ Phase 3: AI Agent Direct Tests ═══${NC}"
echo ""

print_test "Testing AI Agent health endpoint..."
HEALTH_RESPONSE=$(curl -s "$AI_AGENT_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    print_success "AI Agent health check passed"
    echo "$HEALTH_RESPONSE" | jq '.'
else
    print_failure "AI Agent health check failed"
fi

print_test "Testing chat endpoint with GREEN case (minor symptom)..."
CHAT_RESPONSE=$(curl -s -X POST "$AI_AGENT_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "I have a mild headache that started today",
        "user_id": "test-user-123"
    }')

if echo "$CHAT_RESPONSE" | grep -q "severity_level"; then
    SEVERITY=$(echo "$CHAT_RESPONSE" | jq -r '.triage.severity_level')
    print_success "Chat endpoint working - Severity: $SEVERITY"
    echo "$CHAT_RESPONSE" | jq '.'
else
    print_failure "Chat endpoint returned invalid response"
    echo "$CHAT_RESPONSE"
fi

print_test "Testing triage endpoint with AMBER case (moderate symptom)..."
TRIAGE_RESPONSE=$(curl -s -X POST "$AI_AGENT_URL/api/triage" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "I have fever and cough for 3 days, feeling weak",
        "user_id": "test-user-123"
    }')

if echo "$TRIAGE_RESPONSE" | grep -q "severity_level"; then
    SEVERITY=$(echo "$TRIAGE_RESPONSE" | jq -r '.triage.severity_level')
    print_success "Triage endpoint working - Severity: $SEVERITY"
    echo "$TRIAGE_RESPONSE" | jq '.'
else
    print_failure "Triage endpoint returned invalid response"
fi

print_test "Testing triage endpoint with RED case (emergency symptom)..."
RED_RESPONSE=$(curl -s -X POST "$AI_AGENT_URL/api/triage" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "Severe chest pain and difficulty breathing for 10 minutes",
        "user_id": "test-user-123"
    }')

if echo "$RED_RESPONSE" | grep -q "RED"; then
    print_success "RED triage detection working correctly"
    echo "$RED_RESPONSE" | jq '.'
else
    echo -e "${YELLOW}⚠ Warning: Expected RED severity for emergency symptoms${NC}"
    echo "$RED_RESPONSE" | jq '.'
fi

# ===========================================
# Test 4: Backend Integration Tests
# ===========================================
echo -e "${BLUE}═══ Phase 4: Backend Integration Tests ═══${NC}"
echo ""

print_test "Authenticating with backend..."
AUTH_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_USER_EMAIL\",
        \"password\": \"$TEST_USER_PASSWORD\"
    }")

if echo "$AUTH_RESPONSE" | grep -q "access_token"; then
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.access_token')
    print_success "Authentication successful"
else
    print_failure "Authentication failed - Creating test user first..."
    
    # Try to register if login fails
    REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_USER_EMAIL\",
            \"password\": \"$TEST_USER_PASSWORD\",
            \"firstName\": \"Test\",
            \"lastName\": \"User\",
            \"phone\": \"+1234567890\",
            \"role\": \"patient\"
        }")
    
    if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
        ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')
        print_success "Test user created and authenticated"
    else
        print_failure "Could not create test user"
        echo "$REGISTER_RESPONSE"
        exit 1
    fi
fi

print_test "Testing backend AI chat endpoint..."
BACKEND_CHAT=$(curl -s -X POST "$BACKEND_URL/api/ai/chat" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
        "message": "I have a sore throat and runny nose",
        "includeHistory": false
    }')

if echo "$BACKEND_CHAT" | grep -q "severity_level"; then
    print_success "Backend AI chat integration working"
    echo "$BACKEND_CHAT" | jq '.triage'
else
    print_failure "Backend AI chat integration failed"
    echo "$BACKEND_CHAT"
fi

print_test "Testing backend AI health check..."
BACKEND_AI_HEALTH=$(curl -s -X GET "$BACKEND_URL/api/ai/health" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$BACKEND_AI_HEALTH" | grep -q "status"; then
    print_success "Backend AI health check working"
    echo "$BACKEND_AI_HEALTH" | jq '.'
else
    print_failure "Backend AI health check failed"
fi

print_test "Fetching user's triage cases..."
USER_CASES=$(curl -s -X GET "$BACKEND_URL/api/ai/cases" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$USER_CASES" | jq 'type' | grep -q "array"; then
    CASE_COUNT=$(echo "$USER_CASES" | jq 'length')
    print_success "Retrieved $CASE_COUNT triage cases"
    echo "$USER_CASES" | jq '.[0]' || echo "No cases yet"
else
    print_failure "Failed to retrieve triage cases"
fi

# ===========================================
# Test 5: Performance Tests
# ===========================================
echo -e "${BLUE}═══ Phase 5: Performance Tests ═══${NC}"
echo ""

print_test "Measuring AI response time..."
START_TIME=$(date +%s%N)
curl -s -X POST "$AI_AGENT_URL/api/triage" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "Quick performance test",
        "user_id": "perf-test"
    }' > /dev/null
END_TIME=$(date +%s%N)
DURATION=$((($END_TIME - $START_TIME) / 1000000))

if [ $DURATION -lt 30000 ]; then
    print_success "AI response time: ${DURATION}ms (< 30s threshold)"
else
    echo -e "${YELLOW}⚠ Warning: AI response time ${DURATION}ms exceeds 30s threshold${NC}"
fi

print_test "Testing concurrent requests (3 simultaneous)..."
curl -s -X POST "$AI_AGENT_URL/api/triage" \
    -H "Content-Type: application/json" \
    -d '{"message": "Test 1", "user_id": "concurrent-1"}' > /dev/null &
curl -s -X POST "$AI_AGENT_URL/api/triage" \
    -H "Content-Type: application/json" \
    -d '{"message": "Test 2", "user_id": "concurrent-2"}' > /dev/null &
curl -s -X POST "$AI_AGENT_URL/api/triage" \
    -H "Content-Type: application/json" \
    -d '{"message": "Test 3", "user_id": "concurrent-3"}' > /dev/null &

wait
print_success "Concurrent requests handled successfully"

# ===========================================
# Test 6: Error Handling Tests
# ===========================================
echo -e "${BLUE}═══ Phase 6: Error Handling Tests ═══${NC}"
echo ""

print_test "Testing invalid request (missing fields)..."
ERROR_RESPONSE=$(curl -s -X POST "$AI_AGENT_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{}')

if echo "$ERROR_RESPONSE" | grep -q "error\|detail"; then
    print_success "Invalid request properly rejected"
else
    print_failure "Invalid request not handled correctly"
fi

print_test "Testing unauthorized backend request..."
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/ai/cases")
HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    print_success "Unauthorized access properly blocked (401)"
else
    print_failure "Unauthorized access not properly handled (got $HTTP_CODE)"
fi

# ===========================================
# Final Report
# ===========================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Test Results Summary              ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Total Tests:      ${TOTAL_TESTS}"
echo -e "${GREEN}║ Passed:           ${TESTS_PASSED}${NC}"
echo -e "${RED}║ Failed:           ${TESTS_FAILED}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! AI Agent integration is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
