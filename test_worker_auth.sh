#!/bin/bash

WORKER_URL="https://physonsuperplacestudy-production.kohsunwoo12345.workers.dev/grade"
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "🔍 Python Worker 인증 방식 테스트"
echo "=========================================="

# 테스트 1: 제공받은 API 토큰
echo "1️⃣ 테스트: 제공받은 API 토큰"
RESPONSE1=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb" \
  -d "{\"images\":[\"$TEST_IMAGE\"],\"userId\":1,\"userName\":\"test\",\"systemPrompt\":\"test\",\"model\":\"gemini-2.5-flash-lite\",\"temperature\":0.3,\"enableRAG\":false}")

echo "$RESPONSE1"
echo ""

# 테스트 2: 기존 API 키
echo "2️⃣ 테스트: 기존 코드의 API 키"
RESPONSE2=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d "{\"images\":[\"$TEST_IMAGE\"],\"userId\":1,\"userName\":\"test\",\"systemPrompt\":\"test\",\"model\":\"gemini-2.5-flash-lite\",\"temperature\":0.3,\"enableRAG\":false}")

echo "$RESPONSE2"
echo ""

# 테스트 3: Authorization Bearer
echo "3️⃣ 테스트: Authorization Bearer"
RESPONSE3=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb" \
  -d "{\"images\":[\"$TEST_IMAGE\"],\"userId\":1,\"userName\":\"test\",\"systemPrompt\":\"test\",\"model\":\"gemini-2.5-flash-lite\",\"temperature\":0.3,\"enableRAG\":false}")

echo "$RESPONSE3"
echo ""

# 테스트 4: API 키 없이
echo "4️⃣ 테스트: API 키 없이"
RESPONSE4=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -d "{\"images\":[\"$TEST_IMAGE\"],\"userId\":1,\"userName\":\"test\",\"systemPrompt\":\"test\",\"model\":\"gemini-2.5-flash-lite\",\"temperature\":0.3,\"enableRAG\":false}")

echo "$RESPONSE4"
echo ""

echo "=========================================="

