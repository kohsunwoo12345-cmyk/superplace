#!/bin/bash
echo "🔍 실제 배포된 코드 확인..."
echo ""

# API 엔드포인트를 직접 호출하여 에러 메시지 확인
echo "📝 parts 형식 테스트 (상세 에러 분석)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "테스트",
    "botId": "bot-1773803533575-qrn2pluec",
    "conversationHistory": [
      {"role": "user", "parts": [{"text": "안녕하세요"}]}
    ],
    "userId": "debug-user",
    "userRole": "STUDENT"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ 배포 완료 - 수정된 코드가 적용되었습니다"
elif echo "$BODY" | grep -q "parts\[0\].data"; then
  echo "❌ 아직 구버전 코드가 배포되어 있습니다"
  echo ""
  echo "🔄 Cloudflare Pages 배포 상태 확인 방법:"
  echo "1. https://dash.cloudflare.com/ 접속"
  echo "2. Pages > superplacestudy 프로젝트 선택"
  echo "3. 최신 배포가 'Success' 상태인지 확인"
  echo "4. 최신 커밋 해시가 352c516e인지 확인"
  echo ""
  echo "⏳ 배포는 보통 2-3분 소요됩니다"
else
  echo "⚠️ 알 수 없는 에러"
fi
