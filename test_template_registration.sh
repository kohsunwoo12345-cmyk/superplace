#!/bin/bash

# 템플릿 등록 테스트 스크립트
# 사용법: ./test_template_registration.sh

echo "🧪 카카오 알림톡 템플릿 등록 테스트"
echo "======================================"
echo ""

# 환경 변수
API_URL="https://superplacestudy.pages.dev/api/kakao/templates/register"
USER_ID="user-1771479246368-du957iw33"
CHANNEL_ID="ch_1772359215883_fk4otb5hv"

echo "📋 테스트 정보:"
echo "  - API URL: $API_URL"
echo "  - User ID: $USER_ID"
echo "  - Channel ID: $CHANNEL_ID"
echo ""

# 테스트 요청 데이터
REQUEST_DATA='{
  "userId": "'$USER_ID'",
  "channelId": "'$CHANNEL_ID'",
  "content": "안녕하세요 #{학생이름}님, 이번 달 성과리포트입니다.\n\n📊 학습 현황:\n- 출석률: #{출석률}%\n- 과제 제출률: #{과제제출률}%\n\n자세한 내용은 아래 링크를 확인해주세요.\n#{리포트URL}",
  "categoryCode": "012",
  "messageType": "EX",
  "emphasizeType": "TEXT",
  "extra": {
    "title": "이번 달 성과리포트",
    "description": "검단꾸메땅학원"
  },
  "securityFlag": false,
  "variables": ["학생이름", "출석률", "과제제출률", "리포트URL"]
}'

echo "📤 템플릿 등록 요청 중..."
echo ""

# API 호출
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_DATA")

# HTTP 상태 코드 추출
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 응답 결과:"
echo "  HTTP Status: $HTTP_CODE"
echo ""

# 응답 본문 출력 (JSON 포맷팅)
echo "📄 응답 본문:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

# 결과 판정
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ 템플릿 등록 성공!"
  
  # 템플릿 코드 추출
  TEMPLATE_CODE=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('template', {}).get('templateCode', 'N/A'))" 2>/dev/null)
  TEMPLATE_NAME=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('template', {}).get('templateName', 'N/A'))" 2>/dev/null)
  
  echo ""
  echo "📝 등록된 템플릿 정보:"
  echo "  - Template Code: $TEMPLATE_CODE"
  echo "  - Template Name: $TEMPLATE_NAME"
  echo "  - Status: 검수 대기 (REG)"
  echo ""
  echo "🔍 다음 단계:"
  echo "  1. Solapi 콘솔에서 템플릿 승인 상태 확인"
  echo "  2. 카카오 승인 완료 후 발송 테스트"
  
  exit 0
else
  echo "❌ 템플릿 등록 실패!"
  echo ""
  echo "🔍 문제 해결 방법:"
  echo "  1. Solapi API 자격 증명 확인 (SOLAPI_API_Key, SOLAPI_API_SECRET)"
  echo "  2. 카카오 채널 연동 상태 확인"
  echo "  3. 채널명이 Solapi에 등록되어 있는지 확인"
  echo "  4. 서버 로그 확인 (Cloudflare Workers 로그)"
  
  exit 1
fi
