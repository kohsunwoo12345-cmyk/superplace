#!/bin/bash

echo "🚀 01085328739로 실제 알림톡 발송 테스트"
echo "============================================"
echo ""

# 사용자 ID
USER_ID="20640435"
PHONE="01085328739"

echo "1️⃣ 랜딩페이지 목록 조회 중..."
LANDING_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/landing/list?userId=$USER_ID")
echo "$LANDING_RESPONSE" | jq '.' 2>/dev/null || echo "$LANDING_RESPONSE"

# 최신 랜딩페이지 추출
LP_ID=$(echo "$LANDING_RESPONSE" | jq -r '.landingPages[0].id // empty' 2>/dev/null)
LP_TITLE=$(echo "$LANDING_RESPONSE" | jq -r '.landingPages[0].title // empty' 2>/dev/null)
LP_COUNT=$(echo "$LANDING_RESPONSE" | jq -r '.count // 0' 2>/dev/null)

echo ""
echo "📊 조회 결과:"
echo "   - 총 랜딩페이지 수: $LP_COUNT개"
echo "   - 최신 랜딩페이지 ID: $LP_ID"
echo "   - 제목: $LP_TITLE"

if [ -z "$LP_ID" ] || [ "$LP_ID" == "null" ]; then
    echo ""
    echo "❌ 랜딩페이지가 없습니다. 먼저 랜딩페이지를 제작해주세요."
    echo "   https://superplacestudy.pages.dev/landing/create"
    exit 1
fi

echo ""
echo "2️⃣ 채널 정보 조회 중..."
CHANNEL_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/kakao/channels?userId=$USER_ID")
CHANNEL_ID=$(echo "$CHANNEL_RESPONSE" | jq -r '.channels[0].id // empty' 2>/dev/null)
SOLAPI_CHANNEL_ID=$(echo "$CHANNEL_RESPONSE" | jq -r '.channels[0].solapiChannelId // empty' 2>/dev/null)
CHANNEL_NAME=$(echo "$CHANNEL_RESPONSE" | jq -r '.channels[0].channelName // empty' 2>/dev/null)

echo "   - 채널 이름: $CHANNEL_NAME"
echo "   - 채널 ID: $CHANNEL_ID"
echo "   - Solapi 채널 ID: $SOLAPI_CHANNEL_ID"

if [ -z "$CHANNEL_ID" ] || [ "$CHANNEL_ID" == "null" ]; then
    echo ""
    echo "❌ 등록된 채널이 없습니다. 먼저 채널을 등록해주세요."
    exit 1
fi

# 고유 ref 생성
REF_TIMESTAMP=$(date +%s%3N)
LANDING_URL="https://superplacestudy.pages.dev/landing/$LP_ID?studentId=test-임의학생&ref=${REF_TIMESTAMP}_0"

echo ""
echo "3️⃣ 발송 준비 완료"
echo "   =========================================="
echo "   수신자: 임의 학생 (테스트)"
echo "   전화번호: $PHONE"
echo "   템플릿: 기본 템플릿 3 - 학습 안내"
echo "   랜딩페이지: $LP_TITLE"
echo "   URL: $LANDING_URL"
echo "   =========================================="
echo ""

# 발송 페이로드 생성
cat > /tmp/alimtalk-send-payload.json << EOF
{
  "userId": "$USER_ID",
  "channelId": "$CHANNEL_ID",
  "solapiChannelId": "$SOLAPI_CHANNEL_ID",
  "templateCode": "KA01TP221025083117992xkz17KyvNbr",
  "recipients": [
    {
      "name": "임의학생",
      "phoneNumber": "$PHONE",
      "studentId": "test-임의학생-001",
      "landingPageUrl": "$LANDING_URL"
    }
  ],
  "sendMode": "immediate"
}
EOF

echo "📤 발송 페이로드:"
cat /tmp/alimtalk-send-payload.json | jq '.' 2>/dev/null || cat /tmp/alimtalk-send-payload.json

echo ""
echo "4️⃣ 실제 발송 실행 중..."
echo ""

# 실제 발송!
SEND_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/kakao/send-alimtalk" \
  -H "Content-Type: application/json" \
  -d @/tmp/alimtalk-send-payload.json)

echo "📨 발송 결과:"
echo "$SEND_RESPONSE" | jq '.' 2>/dev/null || echo "$SEND_RESPONSE"

# 결과 확인
SUCCESS=$(echo "$SEND_RESPONSE" | jq -r '.success // false' 2>/dev/null)

echo ""
if [ "$SUCCESS" == "true" ]; then
    echo "✅ 발송 성공!"
    echo "   $PHONE 번호로 알림톡이 발송되었습니다."
    echo "   카카오톡을 확인해주세요!"
else
    echo "❌ 발송 실패"
    ERROR_MSG=$(echo "$SEND_RESPONSE" | jq -r '.error // "Unknown error"' 2>/dev/null)
    echo "   오류: $ERROR_MSG"
fi

echo ""
echo "============================================"
echo "🎯 테스트 완료"
