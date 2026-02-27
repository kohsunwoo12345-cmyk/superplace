#!/bin/bash

# Test Landing Page Creation API
# This script simulates the frontend request

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====================================${NC}"
echo -e "${YELLOW}Testing Landing Page Creation API${NC}"
echo -e "${YELLOW}====================================${NC}\n"

# Generate a unique slug
TIMESTAMP=$(date +%s)
RANDOM_STR=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
SLUG="test_lp_${TIMESTAMP}_${RANDOM_STR}"

echo -e "${YELLOW}1. Generated slug: ${NC}${SLUG}"

# Prepare the request payload
PAYLOAD=$(cat <<EOF
{
  "slug": "${SLUG}",
  "studentId": "test-student-123",
  "title": "테스트 랜딩페이지 ${TIMESTAMP}",
  "subtitle": "자동 생성된 테스트 페이지",
  "thumbnail": null,
  "templateId": "basic",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "dataOptions": [],
  "customFormFields": [],
  "folderId": null,
  "isActive": true
}
EOF
)

echo -e "${YELLOW}2. Request payload:${NC}"
echo "$PAYLOAD" | jq '.'

# Get the API endpoint
API_URL="https://superplacestudy.pages.dev/api/admin/landing-pages"

echo -e "\n${YELLOW}3. Sending POST request to: ${NC}${API_URL}"
echo -e "${YELLOW}   (Without auth token - will fail auth but we can see the error)${NC}\n"

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token-for-testing" \
  -d "$PAYLOAD")

# Extract HTTP code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo -e "${YELLOW}4. Response:${NC}"
echo -e "   HTTP Code: ${HTTP_CODE}"
echo -e "   Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

# Check result
echo -e "\n${YELLOW}5. Result:${NC}"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ Success! Landing page created.${NC}"
    echo -e "${GREEN}   URL: https://superplacestudy.pages.dev/lp/${SLUG}${NC}"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠️  Authentication required (expected for this test)${NC}"
    echo -e "${YELLOW}   The API endpoint is working, but needs a valid token.${NC}"
else
    echo -e "${RED}❌ Error: HTTP ${HTTP_CODE}${NC}"
    echo -e "${RED}   Check the error message above.${NC}"
fi

echo -e "\n${YELLOW}====================================${NC}"
echo -e "${YELLOW}Test Complete${NC}"
echo -e "${YELLOW}====================================${NC}"
