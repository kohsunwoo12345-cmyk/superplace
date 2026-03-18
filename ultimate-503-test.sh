#!/bin/bash

echo "=========================================="
echo "🔥 ULTIMATE 503 ERROR RESOLUTION TEST"
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
echo ""

# Cloudflare Pages 배포 대기
echo "⏳ Cloudflare Pages 배포 대기 중... (3분 30초)"
sleep 210

API_URL="https://suplacestudy.com/api/ai-chat"
STUDENT_BOT_ID="bot-1773803533575-qrn2pluec"

echo ""
echo "=========================================="
echo "📊 TEST SUITE 1: 고부하 시나리오 (20회 연속 요청)"
echo "=========================================="

SUCCESS_COUNT=0
FAIL_COUNT=0
ERROR_503_COUNT=0
TOTAL_RETRY_COUNT=0

for i in {1..20}; do
  echo ""
  echo "▶ Request #$i/20:"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "안녕하세요 테스트 '${i}'번째 메시지입니다",
      "botId": "'"$STUDENT_BOT_ID"'",
      "conversationHistory": [],
      "userId": "stress-test-user",
      "sessionId": "stress-session-'$i'"
    }')
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  SUCCESS=$(echo "$BODY" | jq -r '.success // false')
  
  if [ "$HTTP_CODE" = "503" ]; then
    ERROR_503_COUNT=$((ERROR_503_COUNT + 1))
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RETRY_AFTER=$(echo "$BODY" | jq -r '.retryAfterSeconds // "N/A"')
    ATTEMPTED_MODELS=$(echo "$BODY" | jq -r '.attemptedModels // [] | join(" → ")')
    RETRY_COUNT=$(echo "$BODY" | jq -r '.retryCount // 0')
    TOTAL_RETRY_COUNT=$((TOTAL_RETRY_COUNT + RETRY_COUNT))
    echo "   ❌ 503 ERROR"
    echo "   Retry after: ${RETRY_AFTER}s"
    echo "   Retries: $RETRY_COUNT"
    echo "   Models: $ATTEMPTED_MODELS"
  elif [ "$SUCCESS" = "true" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    RETRY_COUNT=$(echo "$BODY" | jq -r '.retryCount // 0')
    ATTEMPTED_MODELS=$(echo "$BODY" | jq -r '.attemptedModels // [] | length')
    TOTAL_RETRY_COUNT=$((TOTAL_RETRY_COUNT + RETRY_COUNT))
    echo "   ✅ SUCCESS"
    if [ "$RETRY_COUNT" != "0" ] && [ "$RETRY_COUNT" != "null" ]; then
      echo "   Retries needed: $RETRY_COUNT"
    fi
    if [ "$ATTEMPTED_MODELS" != "0" ] && [ "$ATTEMPTED_MODELS" != "null" ]; then
      echo "   Models tried: $ATTEMPTED_MODELS"
    fi
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    ERROR=$(echo "$BODY" | jq -r '.error // "unknown"')
    echo "   ❌ FAILED (HTTP $HTTP_CODE)"
    echo "   Error: $ERROR"
  fi
  
  # 요청 간 짧은 대기 (실제 사용자 시뮬레이션)
  sleep 0.3
done

echo ""
echo "=========================================="
echo "📊 TEST SUITE 2: 실제 학생 계정 시나리오"
echo "=========================================="

# 학생 계정 시뮬레이션 1
echo ""
echo "▶ 학생 계정 Test 1: 첫 대화"
RESP_S1=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요, 영어 단어 테스트 해주세요",
    "botId": "'"$STUDENT_BOT_ID"'",
    "conversationHistory": [],
    "userId": "student-001",
    "sessionId": "student-session-001",
    "userRole": "student"
  }')
HTTP_S1=$(echo "$RESP_S1" | tail -n1)
BODY_S1=$(echo "$RESP_S1" | head -n-1)
SUCCESS_S1=$(echo "$BODY_S1" | jq -r '.success // false')

if [ "$SUCCESS_S1" = "true" ]; then
  echo "   ✅ SUCCESS"
  PREVIEW=$(echo "$BODY_S1" | jq -r '.response' | head -c 60)
  echo "   Response: $PREVIEW..."
else
  echo "   ❌ FAILED (HTTP $HTTP_S1)"
  ERROR_S1=$(echo "$BODY_S1" | jq -r '.error // "unknown"')
  echo "   Error: $ERROR_S1"
fi

# 학원장 계정 시뮬레이션
echo ""
echo "▶ 학원장 계정 Test: 대화 이력 포함"
RESP_O1=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "학생들 성적 분석해줘",
    "botId": "'"$STUDENT_BOT_ID"'",
    "conversationHistory": [
      {"role": "user", "parts": [{"text": "안녕하세요"}]},
      {"role": "model", "parts": [{"text": "안녕하세요! 무엇을 도와드릴까요?"}]}
    ],
    "userId": "owner-001",
    "sessionId": "owner-session-001",
    "userRole": "director"
  }')
HTTP_O1=$(echo "$RESP_O1" | tail -n1)
BODY_O1=$(echo "$RESP_O1" | head -n-1)
SUCCESS_O1=$(echo "$BODY_O1" | jq -r '.success // false')

if [ "$SUCCESS_O1" = "true" ]; then
  echo "   ✅ SUCCESS"
  PREVIEW_O=$(echo "$BODY_O1" | jq -r '.response' | head -c 60)
  echo "   Response: $PREVIEW_O..."
else
  echo "   ❌ FAILED (HTTP $HTTP_O1)"
  ERROR_O1=$(echo "$BODY_O1" | jq -r '.error // "unknown"')
  echo "   Error: $ERROR_O1"
fi

echo ""
echo "=========================================="
echo "📊 FINAL RESULTS"
echo "=========================================="
echo ""
echo "Test Suite 1 (고부하 테스트 20회):"
echo "   ✅ Success: $SUCCESS_COUNT/20 ($(echo "scale=1; $SUCCESS_COUNT * 100 / 20" | bc 2>/dev/null || echo "N/A")%)"
echo "   ❌ Failed: $FAIL_COUNT/20"
echo "   ⚠️  503 Errors: $ERROR_503_COUNT/20 ($(echo "scale=1; $ERROR_503_COUNT * 100 / 20" | bc 2>/dev/null || echo "N/A")%)"
echo "   🔄 Total Retries: $TOTAL_RETRY_COUNT"
if [ $SUCCESS_COUNT -gt 0 ]; then
  echo "   📊 Avg Retries per Success: $(echo "scale=2; $TOTAL_RETRY_COUNT / $SUCCESS_COUNT" | bc 2>/dev/null || echo "N/A")"
fi
echo ""
echo "Test Suite 2 (실제 계정 시나리오):"
echo "   학생 계정: $([ "$SUCCESS_S1" = "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "   학원장 계정: $([ "$SUCCESS_O1" = "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo ""

# 최종 판정
PASS_RATE=$(echo "scale=1; $SUCCESS_COUNT * 100 / 20" | bc 2>/dev/null || echo "0")
PASS_RATE_INT=$(echo "$PASS_RATE" | cut -d'.' -f1)

if [ "$PASS_RATE_INT" -ge 95 ] && [ "$SUCCESS_S1" = "true" ] && [ "$SUCCESS_O1" = "true" ]; then
  echo "=========================================="
  echo "🎉 SUCCESS: 503 에러 해결 완료!"
  echo "=========================================="
  echo ""
  echo "✅ 성공률 $PASS_RATE% (목표: ≥95%)"
  echo "✅ 학생 계정 정상 작동"
  echo "✅ 학원장 계정 정상 작동"
  echo "✅ 시스템 안정성 확보"
  echo ""
  exit 0
else
  echo "=========================================="
  echo "⚠️  WARNING: 목표 미달성"
  echo "=========================================="
  echo ""
  if [ "$PASS_RATE_INT" -lt 95 ]; then
    echo "❌ 성공률 $PASS_RATE% (목표: ≥95%)"
  fi
  if [ "$SUCCESS_S1" != "true" ]; then
    echo "❌ 학생 계정 실패"
  fi
  if [ "$SUCCESS_O1" != "true" ]; then
    echo "❌ 학원장 계정 실패"
  fi
  if [ $ERROR_503_COUNT -gt 0 ]; then
    echo "❌ 503 에러 여전히 발생 중 ($ERROR_503_COUNT건)"
  fi
  echo ""
  exit 1
fi
