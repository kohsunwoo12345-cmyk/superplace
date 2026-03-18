#!/bin/bash

echo "=========================================="
echo "🔍 실제 계정 503 에러 진단"
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
echo ""

API_URL="https://suplacestudy.com/api/ai-chat"
STUDENT_BOT_ID="bot-1773803533575-qrn2pluec"

# 1. 실제 에러 재현
echo "📍 Step 1: 503 에러 재현 테스트 (3회 연속 요청)"
for i in {1..3}; do
  echo ""
  echo "Request #$i:"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "안녕하세요 테스트입니다",
      "botId": "'"$STUDENT_BOT_ID"'",
      "conversationHistory": [],
      "userId": "test-student-real",
      "sessionId": "session-real-'$i'",
      "userRole": "student"
    }')
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  echo "HTTP Status: $HTTP_CODE"
  
  if [ "$HTTP_CODE" = "503" ]; then
    echo "❌ 503 에러 발생!"
    echo "Response body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  elif [ "$HTTP_CODE" = "200" ]; then
    SUCCESS=$(echo "$BODY" | jq -r '.success // false')
    if [ "$SUCCESS" = "true" ]; then
      echo "✅ 성공"
      echo "Response preview: $(echo "$BODY" | jq -r '.response' | head -c 80)..."
    else
      echo "❌ 실패 (success=false)"
      echo "Error: $(echo "$BODY" | jq -r '.error')"
    fi
  else
    echo "⚠️  Unexpected status: $HTTP_CODE"
    echo "$BODY"
  fi
  
  sleep 1
done

echo ""
echo "=========================================="
echo "📍 Step 2: Backend 로그 확인"
echo "=========================================="
echo ""
echo "최신 배포 커밋 확인:"
git log --oneline -5

echo ""
echo "=========================================="
echo "📍 Step 3: 백엔드 코드 점검"
echo "=========================================="

# ai-chat.ts 파일에서 재시도 로직 확인
echo ""
echo "재시도 로직 확인 (fallbackModels):"
grep -A 5 "fallbackModels" functions/api/ai-chat.ts | head -10

echo ""
echo "지수 백오프 확인:"
grep -A 3 "delays.*=" functions/api/ai-chat.ts | head -5

echo ""
echo "=========================================="
echo "진단 완료"
echo "=========================================="
