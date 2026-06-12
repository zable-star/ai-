#!/bin/bash

# Quick test script for backend API

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "Voice Drawing Backend API Test"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Health check
echo -e "${YELLOW}1. Testing health endpoint...${NC}"
curl -s "${BASE_URL%/api}/health" | jq .
echo ""

# Register user
echo -e "${YELLOW}2. Registering test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser_'$(date +%s)'","password":"test123456"}')

echo $REGISTER_RESPONSE | jq .

if echo $REGISTER_RESPONSE | jq -e '.success' > /dev/null; then
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')
    echo -e "${GREEN}✓ Registration successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Registration failed${NC}"
    exit 1
fi
echo ""

# Get current user
echo -e "${YELLOW}3. Getting current user...${NC}"
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Create model profile
echo -e "${YELLOW}4. Creating model profile...${NC}"
CREATE_PROFILE=$(curl -s -X POST "$BASE_URL/models" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test OpenAI",
    "provider": "openai",
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "model": "gpt-4o-mini",
    "apiKey": "sk-test-key-12345",
    "enabled": true
  }')

echo $CREATE_PROFILE | jq .

if echo $CREATE_PROFILE | jq -e '.success' > /dev/null; then
    PROFILE_ID=$(echo $CREATE_PROFILE | jq -r '.data.profile.id')
    echo -e "${GREEN}✓ Model profile created${NC}"
else
    echo -e "${RED}✗ Failed to create model profile${NC}"
fi
echo ""

# List model profiles
echo -e "${YELLOW}5. Listing model profiles...${NC}"
curl -s -X GET "$BASE_URL/models" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Create drawing
echo -e "${YELLOW}6. Creating drawing...${NC}"
CREATE_DRAWING=$(curl -s -X POST "$BASE_URL/drawings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Drawing",
    "actions": [
      {"type": "drawShape", "shape": "circle", "color": "#ef4444", "position": {"x": 0.5, "y": 0.5}}
    ],
    "thumbnail": null
  }')

echo $CREATE_DRAWING | jq .

if echo $CREATE_DRAWING | jq -e '.success' > /dev/null; then
    DRAWING_ID=$(echo $CREATE_DRAWING | jq -r '.data.drawing.id')
    echo -e "${GREEN}✓ Drawing created${NC}"
else
    echo -e "${RED}✗ Failed to create drawing${NC}"
fi
echo ""

# List drawings
echo -e "${YELLOW}7. Listing drawings...${NC}"
curl -s -X GET "$BASE_URL/drawings" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo -e "${GREEN}Test completed!${NC}"
echo ""
echo "Summary:"
echo "  Token: ${TOKEN:0:30}..."
echo "  Profile ID: $PROFILE_ID"
echo "  Drawing ID: $DRAWING_ID"
