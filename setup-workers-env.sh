#!/bin/bash

ACCOUNT_ID="e8c2bd49c64f5f1dd05cd2e19c80dd85"
WORKER_NAME="physonsuperplacestudy"
API_TOKEN="R6lNqS0bf8OLg4vhgzQtzIy-AaXSfNMmGlUOtjA1"

echo "=========================================="
echo "🔧 Cloudflare Workers 환경 변수 설정"
echo "=========================================="
echo ""

# 1. Worker 정보 확인
echo "1️⃣ Worker 정보 확인..."
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" | jq '{success, errors, result: {id: .result.id, created_on: .result.created_on}}'
echo ""

# 2. Worker 환경 변수 확인
echo "2️⃣ 현재 환경 변수 확인..."
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}/settings" \
  -H "Authorization: Bearer ${API_TOKEN}" | jq '.result.bindings // []'
echo ""

# 3. Python Worker 엔드포인트 테스트
echo "3️⃣ Python Worker 엔드포인트 테스트..."
WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"

echo "GET ${WORKER_URL}/"
curl -s "${WORKER_URL}/" | head -c 500
echo ""
echo ""

echo "POST ${WORKER_URL}/solve"
curl -s -X POST "${WORKER_URL}/solve" \
  -H "Content-Type: application/json" \
  -d '{"equation": "2 + 3"}' | jq '.'
echo ""

echo "=========================================="
echo "완료"
echo "=========================================="
