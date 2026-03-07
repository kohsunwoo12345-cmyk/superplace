#!/bin/bash

echo "🚀 실제 발송: 01085328739 (채널 wearesuperplace, 템플릿 1)"
echo "================================================================"
echo ""

# 설정
USER_ID="20640435"
PHONE="01085328739"
CHANNEL_ID="wearesuperplace"
SOLAPI_CHANNEL_ID="wearesuperplace"
CHANNEL_NAME="wearesuperplace"

# 템플릿 1 정보
TEMPLATE_CODE="KA01TP230126085130773ZHclHN4i674"
TEMPLATE_NAME="기본 템플릿 1"

echo "1️⃣ 발송 정보"
echo "   채널: $CHANNEL_NAME"
echo "   템플릿: $TEMPLATE_NAME"
echo "   템플릿 코드: $TEMPLATE_CODE"
echo "   수신자: $PHONE"
echo ""

echo "2️⃣ 템플릿 내용 (코드에 정의된 내용)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "안녕하세요 #{name}님, 기본 템플릿 1입니다."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  주의: Solapi에 등록된 실제 템플릿 내용과 일치해야 합니다!"
echo ""

# 랜딩페이지 조회 (템플릿 1은 URL 없이도 가능)
echo "3️⃣ 랜딩페이지 조회 중..."
LANDING_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/landing/list?userId=$USER_ID")
LP_ID=$(echo "$LANDING_RESPONSE" | jq -r '.landingPages[0].id // empty' 2>/dev/null)
LP_TITLE=$(echo "$LANDING_RESPONSE" | jq -r '.landingPages[0].title // empty' 2>/dev/null)

if [ -n "$LP_ID" ]; then
    echo "   ✅ 최신 랜딩페이지: $LP_TITLE (ID: $LP_ID)"
    REF_TIMESTAMP=$(date +%s%3N)
    LANDING_URL="https://superplacestudy.pages.dev/landing/$LP_ID?studentId=test-임의학생&ref=${REF_TIMESTAMP}_0"
else
    echo "   ⚠️  랜딩페이지 없음 (템플릿 1은 URL 불필요)"
    LANDING_URL=""
fi
echo ""

echo "4️⃣ 발송 페이로드 생성"
cat > /tmp/send-template1.json << EOF
{
  "userId": "$USER_ID",
  "channelId": "$CHANNEL_ID",
  "solapiChannelId": "$SOLAPI_CHANNEL_ID",
  "templateCode": "$TEMPLATE_CODE",
  "recipients": [
    {
      "name": "테스트사용자",
      "phoneNumber": "$PHONE",
      "studentId": "test-001",
      "landingPageUrl": "$LANDING_URL"
    }
  ],
  "sendMode": "immediate"
}
EOF

echo "📤 페이로드:"
cat /tmp/send-template1.json | jq '.' 2>/dev/null

echo ""
echo "5️⃣ 발송될 메시지 미리보기:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "안녕하세요 테스트사용자님, 기본 템플릿 1입니다."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "6️⃣ 실제 발송 API 호출 중..."
echo ""

SEND_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/kakao/send-alimtalk" \
  -H "Content-Type: application/json" \
  -d @/tmp/send-template1.json)

echo "📨 발송 결과:"
echo "$SEND_RESPONSE" | jq '.' 2>/dev/null || echo "$SEND_RESPONSE"

SUCCESS=$(echo "$SEND_RESPONSE" | jq -r '.success // false' 2>/dev/null)

echo ""
echo "================================================================"
if [ "$SUCCESS" == "true" ]; then
    echo "✅ 발송 성공!"
    echo ""
    echo "   📱 $PHONE 번호로 카카오 알림톡이 발송되었습니다!"
    echo "   💬 메시지: 안녕하세요 테스트사용자님, 기본 템플릿 1입니다."
    echo ""
    echo "   📲 카카오톡 앱을 확인해주세요!"
else
    echo "❌ 발송 실패"
    ERROR_MSG=$(echo "$SEND_RESPONSE" | jq -r '.error // .message // "Unknown error"' 2>/dev/null)
    ERROR_CODE=$(echo "$SEND_RESPONSE" | jq -r '.details.errorCode // "N/A"' 2>/dev/null)
    echo "   오류 코드: $ERROR_CODE"
    echo "   오류 메시지: $ERROR_MSG"
    echo ""
    echo "   가능한 원인:"
    echo "   1. 채널 ID 'wearesuperplace'가 Solapi에 등록되지 않음"
    echo "   2. 템플릿 코드가 채널에 연결되지 않음"
    echo "   3. Solapi 템플릿 내용이 다름"
    echo "   4. API 키 문제"
fi
echo "================================================================"
