#!/bin/bash

API_TOKEN="IMD0nKq28gqav_5BytcRDBhFNJDbvqVswrZVfKtp"
ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
WORKER_NAME="physonsuperplacestudy"

echo "🔐 Gemini API 키 업데이트"
echo ""

# 사용자가 이미 설정한 것과 동일한 키 사용 (환경 변수명을 확인)
echo "GOOGLE_GEMINI_API_KEY 업데이트 중..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/secrets" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GOOGLE_GEMINI_API_KEY",
    "text": "'"$GOOGLE_GEMINI_API_KEY"'",
    "type": "secret_text"
  }' | jq -r '.success'

echo ""
echo "참고: 실제 Gemini API 키는 Cloudflare Pages 환경 변수에 설정되어 있습니다."
echo "Worker가 정상 작동하려면 Pages와 동일한 API 키가 필요합니다."
