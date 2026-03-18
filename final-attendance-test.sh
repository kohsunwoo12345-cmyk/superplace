#!/bin/bash

echo "============================================="
echo "출석 인증 최종 테스트 (assigned_class 사용)"
echo "============================================="
echo ""
echo "⏳ Cloudflare Pages 배포 대기 중 (3분)..."
sleep 180

echo ""
echo "=== 테스트 1: 존재하지 않는 출석 코드 테스트 ==="
RESPONSE1=$(curl -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code": "999999"}' \
  -s)

echo "응답:"
echo "$RESPONSE1" | head -5

# D1_ERROR 체크
if echo "$RESPONSE1" | grep -qi "D1_ERROR\|no such column"; then
  echo ""
  echo "❌ 여전히 D1 에러 발생!"
  echo "에러 내용:"
  echo "$RESPONSE1" | grep -i "error"
elif echo "$RESPONSE1" | grep -q "유효하지 않은 출석 코드"; then
  echo ""
  echo "✅ 정상 동작! (존재하지 않는 코드 에러는 예상된 동작)"
else
  echo ""
  echo "⚠️  알 수 없는 응답"
fi

echo ""
echo "=== 테스트 2: AI 챗봇 RAG 재확인 ==="
RESPONSE2=$(curl -X POST "https://suplacestudy.com/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "출석 시스템 사용법을 알려주세요",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "final-test-'$(date +%s)'",
    "conversationHistory": []
  }' \
  -s)

if echo "$RESPONSE2" | grep -q '"success":true'; then
  echo "✅ AI 챗봇 정상 작동"
  if echo "$RESPONSE2" | grep -qi "출석"; then
    echo "✅ RAG 기반 응답 확인 (출석 키워드 포함)"
  fi
else
  echo "❌ AI 챗봇 에러"
fi

echo ""
echo "============================================="
echo "최종 결과"
echo "============================================="
echo ""
echo "1. 출석 API: 스키마 에러 확인"
echo "2. AI 챗봇 RAG: 작동 여부 확인"
echo ""
echo "✅ 테스트 완료"
echo "============================================="
