#!/bin/bash

echo "🧪 Testing MediBot Authentication"
echo "=================================="
echo ""

# Test 1: Login and get token
echo "1️⃣ Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Extract token (basic extraction - you may need to adjust based on response format)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Could not extract token from login response"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# Test 2: Test AI chat with token
echo "2️⃣ Testing AI chat with token..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai-chat/chat/triage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "I have a headache",
    "includeHistory": false
  }')

echo "Chat response: $CHAT_RESPONSE"
echo ""

# Test 3: Test without token
echo "3️⃣ Testing AI chat WITHOUT token (should fail)..."
NOAUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai-chat/chat/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a headache",
    "includeHistory": false
  }')

echo "No-auth response: $NOAUTH_RESPONSE"
echo ""

if echo "$NOAUTH_RESPONSE" | grep -q "Unauthorized"; then
  echo "✅ Correctly returns Unauthorized without token"
else
  echo "⚠️  Did not return Unauthorized"
fi

echo ""
echo "🎯 Summary"
echo "=========="
echo "Token: ${TOKEN:0:30}..."
echo ""
echo "💡 To use in browser console:"
echo "localStorage.setItem('auth_token', '$TOKEN');"
