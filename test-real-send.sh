#!/bin/bash

echo "=== 실제 알림톡 발송 테스트 ==="
echo ""

# 1. 현재 사용자의 랜딩페이지 확인
echo "1️⃣ 사용자 20640435의 랜딩페이지 확인..."
LANDING_PAGES=$(curl -s "https://superplacestudy.pages.dev/api/landing/list?userId=20640435")
echo "$LANDING_PAGES" | jq -r '.landingPages[] | "ID: \(.id), Title: \(.title), Slug: \(.slug)"' 2>/dev/null || echo "$LANDING_PAGES"

echo ""
echo "2️⃣ 최신 랜딩페이지 선택..."
LATEST_LP=$(echo "$LANDING_PAGES" | jq -r '.landingPages[0]' 2>/dev/null)
LP_ID=$(echo "$LATEST_LP" | jq -r '.id' 2>/dev/null)
LP_TITLE=$(echo "$LATEST_LP" | jq -r '.title' 2>/dev/null)
echo "선택된 랜딩페이지: ID=$LP_ID, Title=$LP_TITLE"

echo ""
echo "3️⃣ 채널 정보 확인..."
CHANNELS=$(curl -s "https://superplacestudy.pages.dev/api/kakao/channels?userId=20640435")
CHANNEL_ID=$(echo "$CHANNELS" | jq -r '.channels[0].id' 2>/dev/null)
SOLAPI_CHANNEL_ID=$(echo "$CHANNELS" | jq -r '.channels[0].solapiChannelId' 2>/dev/null)
echo "채널 ID: $CHANNEL_ID"
echo "Solapi 채널 ID: $SOLAPI_CHANNEL_ID"

echo ""
echo "4️⃣ 실제 발송 준비..."
echo "수신자: 임의 학생 (테스트)"
echo "전화번호: 01085328739"
echo "템플릿: 기본 템플릿 3 - 학습 안내"
echo "랜딩페이지 URL: https://superplacestudy.pages.dev/landing/$LP_ID?studentId=test-student&ref=$(date +%s)"

echo ""
echo "5️⃣ 발송 API 호출 준비..."
cat > /tmp/send-payload.json << PAYLOAD
{
  "userId": "20640435",
  "channelId": "$CHANNEL_ID",
  "solapiChannelId": "$SOLAPI_CHANNEL_ID",
  "templateCode": "KA01TP221025083117992xkz17KyvNbr",
  "recipients": [
    {
      "name": "테스트학생",
      "phoneNumber": "01085328739",
      "studentId": "test-student-001",
      "landingPageUrl": "https://superplacestudy.pages.dev/landing/$LP_ID?studentId=test-student-001&ref=$(date +%s)_0"
    }
  ],
  "sendMode": "immediate"
}
PAYLOAD

echo "📤 발송 페이로드:"
cat /tmp/send-payload.json | jq '.' 2>/dev/null || cat /tmp/send-payload.json

echo ""
echo "⚠️ 실제 발송은 주석 처리됨 - 발송하려면 아래 주석을 해제하세요:"
echo "# curl -X POST 'https://superplacestudy.pages.dev/api/kakao/send-alimtalk' \\"
echo "#   -H 'Content-Type: application/json' \\"
echo "#   -d @/tmp/send-payload.json"

