#!/bin/bash

echo "🚀 01085328739로 실제 알림톡 발송 (하드코딩 채널 사용)"
echo "============================================================"
echo ""

# 사용자 ID
USER_ID="20640435"
PHONE="01085328739"

# 하드코딩된 채널 정보 (꾸메땅학원)
CHANNEL_ID="ch_1772812174879_h5bxz1kqm"
SOLAPI_CHANNEL_ID="ch_1772812174879_h5bxz1kqm"
CHANNEL_NAME="꾸메땅학원"

echo "1️⃣ 랜딩페이지 목록 조회 중..."
LANDING_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/landing/list?userId=$USER_ID")

# 최신 랜딩페이지 추출
LP_ID=$(echo "$LANDING_RESPONSE" | jq -r '.landingPages[0].id // empty' 2>/dev/null)
LP_TITLE=$(echo "$LANDING_RESPONSE" | jq -r '.landingPages[0].title // empty' 2>/dev/null)
LP_COUNT=$(echo "$LANDING_RESPONSE" | jq -r '.count // 0' 2>/dev/null)

echo "   ✅ 총 $LP_COUNT개 랜딩페이지 발견"
echo "   📄 최신: $LP_TITLE (ID: $LP_ID)"

if [ -z "$LP_ID" ] || [ "$LP_ID" == "null" ]; then
    echo ""
    echo "❌ 랜딩페이지가 없습니다."
    exit 1
fi

echo ""
echo "2️⃣ 채널 정보 (하드코딩)"
echo "   📢 채널: $CHANNEL_NAME"
echo "   🆔 채널 ID: $CHANNEL_ID"

# 고유 ref 생성
REF_TIMESTAMP=$(date +%s%3N)
LANDING_URL="https://superplacestudy.pages.dev/landing/$LP_ID?studentId=test-임의학생&ref=${REF_TIMESTAMP}_0"

echo ""
echo "3️⃣ 발송 준비 완료"
echo "   =========================================================="
echo "   📱 수신자: 임의 학생 (테스트)"
echo "   ☎️  전화번호: $PHONE"
echo "   💬 템플릿: 기본 템플릿 3 - 학습 안내"
echo "   📄 랜딩페이지: $LP_TITLE"
echo "   🔗 URL: $LANDING_URL"
echo "   =========================================================="
echo ""

# 템플릿 내용 미리보기
echo "📝 발송될 메시지 미리보기:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[학습 안내]"
echo ""
echo "안녕하세요, 임의학생 학생 학부모님"
echo "꾸메땅학원입니다."
echo ""
echo "오늘 준비된 맞춤형 학습 페이지 안내드립니다."
echo "아래 링크를 클릭하여 이번달 리포트를 확인해 주세요!"
echo ""
echo "■ 학습 페이지: $LANDING_URL"
echo ""
echo "※ 본 메시지는 수신 동의하신 분들께 발송되는 학습 안내 정보입니다."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 발송 페이로드 생성
cat > /tmp/alimtalk-send-real.json << EOF
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

echo "📤 발송 API 호출 중..."
echo ""

# 실제 발송!
SEND_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/kakao/send-alimtalk" \
  -H "Content-Type: application/json" \
  -d @/tmp/alimtalk-send-real.json)

echo "📨 API 응답:"
echo "$SEND_RESPONSE" | jq '.' 2>/dev/null || echo "$SEND_RESPONSE"

# 결과 확인
SUCCESS=$(echo "$SEND_RESPONSE" | jq -r '.success // false' 2>/dev/null)

echo ""
echo "============================================================"
if [ "$SUCCESS" == "true" ]; then
    echo "✅ 발송 성공!"
    echo ""
    echo "   📱 $PHONE 번호로 알림톡이 발송되었습니다!"
    echo "   📲 카카오톡 앱을 확인해주세요!"
    echo ""
    echo "   📄 랜딩페이지: $LP_TITLE"
    echo "   🔗 URL 클릭 시 이동: https://superplacestudy.pages.dev/landing/$LP_ID"
else
    echo "❌ 발송 실패"
    ERROR_MSG=$(echo "$SEND_RESPONSE" | jq -r '.error // .message // "Unknown error"' 2>/dev/null)
    echo "   오류: $ERROR_MSG"
    echo ""
    echo "   발송 페이로드:"
    cat /tmp/alimtalk-send-real.json | jq '.' 2>/dev/null
fi
echo "============================================================"
