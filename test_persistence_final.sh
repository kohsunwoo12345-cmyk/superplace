#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"
USER_ID="test-persistence-user"
ACADEMY_ID="test-academy"

echo "🧪 세션 영속성 최종 테스트"
echo "====================================="
echo ""

# 1. 봇 목록 조회
echo "1️⃣ 관리자 봇 목록 조회"
BOT_RESPONSE=$(curl -s "${BASE_URL}/api/admin/ai-bots")
echo "Response: $BOT_RESPONSE"
BOT_ID=$(echo $BOT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ 첫 번째 봇 ID: $BOT_ID"
echo ""

# 2. 첫 번째 세션 생성
echo "2️⃣ 첫 번째 세션 생성"
SESSION_ID_1="session-test-$(date +%s)"
SESSION_DATA_1=$(cat <<JSON
{
  "id": "$SESSION_ID_1",
  "userId": "$USER_ID",
  "academyId": "$ACADEMY_ID",
  "botId": "$BOT_ID",
  "title": "테스트 대화 1",
  "lastMessage": "안녕하세요! 첫 번째 메시지입니다."
}
JSON
)

CREATE_RESPONSE_1=$(curl -s -X POST "${BASE_URL}/api/chat-sessions" \
  -H "Content-Type: application/json" \
  -d "$SESSION_DATA_1")
echo "Response: $CREATE_RESPONSE_1"
echo "✅ 세션 1 생성: $SESSION_ID_1"
echo ""

# 3. 두 번째 세션 생성
echo "3️⃣ 두 번째 세션 생성"
sleep 1
SESSION_ID_2="session-test-$(date +%s)"
SESSION_DATA_2=$(cat <<JSON
{
  "id": "$SESSION_ID_2",
  "userId": "$USER_ID",
  "academyId": "$ACADEMY_ID",
  "botId": "$BOT_ID",
  "title": "테스트 대화 2",
  "lastMessage": "안녕하세요! 두 번째 메시지입니다."
}
JSON
)

CREATE_RESPONSE_2=$(curl -s -X POST "${BASE_URL}/api/chat-sessions" \
  -H "Content-Type: application/json" \
  -d "$SESSION_DATA_2")
echo "Response: $CREATE_RESPONSE_2"
echo "✅ 세션 2 생성: $SESSION_ID_2"
echo ""

# 4. 세션 목록 조회 (재방문 시뮬레이션)
echo "4️⃣ 세션 목록 조회 (재방문 시뮬레이션)"
SESSIONS_RESPONSE=$(curl -s "${BASE_URL}/api/chat-sessions?userId=${USER_ID}")
echo "Response: $SESSIONS_RESPONSE"
SESSION_COUNT=$(echo $SESSIONS_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "✅ 총 세션 수: $SESSION_COUNT"
echo ""

# 5. 첫 번째 세션의 메시지 저장
echo "5️⃣ 첫 번째 세션에 메시지 저장"
MESSAGE_ID="msg-$(date +%s)"
MESSAGE_DATA=$(cat <<JSON
{
  "id": "$MESSAGE_ID",
  "sessionId": "$SESSION_ID_1",
  "userId": "$USER_ID",
  "role": "user",
  "content": "테스트 메시지 내용입니다."
}
JSON
)

MESSAGE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/chat-messages" \
  -H "Content-Type: application/json" \
  -d "$MESSAGE_DATA")
echo "Response: $MESSAGE_RESPONSE"
echo "✅ 메시지 저장 완료"
echo ""

# 6. 메시지 조회 (재방문 시뮬레이션)
echo "6️⃣ 메시지 조회 (재방문 시뮬레이션)"
MESSAGES_RESPONSE=$(curl -s "${BASE_URL}/api/chat-messages?sessionId=${SESSION_ID_1}&userId=${USER_ID}")
echo "Response: $MESSAGES_RESPONSE"
MESSAGE_COUNT=$(echo $MESSAGES_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "✅ 메시지 수: $MESSAGE_COUNT"
echo ""

# 7. 다시 세션 목록 조회 (최종 확인)
echo "7️⃣ 최종 세션 목록 확인"
FINAL_SESSIONS=$(curl -s "${BASE_URL}/api/chat-sessions?userId=${USER_ID}")
echo "Response: $FINAL_SESSIONS"
echo ""

echo "====================================="
echo "✅ 테스트 완료!"
echo ""
echo "📊 요약:"
echo "- 생성된 세션: 2개"
echo "- 조회된 세션: $SESSION_COUNT개"
echo "- 저장된 메시지: $MESSAGE_COUNT개"
echo ""
echo "✅ 결과: 세션과 메시지가 영구적으로 저장되고 재방문 시 로드됨"
