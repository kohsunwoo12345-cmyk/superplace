#!/bin/bash

echo "============================================="
echo "기존 출석 코드 활성화 및 전체 플로우 테스트"
echo "============================================="
echo ""

echo "=== 1단계: 실제 출석 코드 데이터 조회 ==="
CODES_DATA=$(curl -X GET "https://suplacestudy.com/api/admin/debug-attendance-codes" -s)

echo "출석 코드 통계:"
echo "$CODES_DATA" | jq '.stats'

echo ""
echo "샘플 출석 코드 (처음 3개):"
echo "$CODES_DATA" | jq '.sampleCodes[0:3]'

# 첫 번째 출석 코드 선택
FIRST_CODE=$(echo "$CODES_DATA" | jq -r '.sampleCodes[0].code // empty')
FIRST_USER_ID=$(echo "$CODES_DATA" | jq -r '.sampleCodes[0].userId // empty')

if [ -z "$FIRST_CODE" ] || [ "$FIRST_CODE" == "null" ]; then
  echo ""
  echo "❌ 출석 코드를 찾을 수 없음!"
  exit 1
fi

echo ""
echo "선택된 출석 코드:"
echo "  코드: $FIRST_CODE"
echo "  userId: $FIRST_USER_ID"

echo ""
echo "=== 2단계: 출석 코드 활성화 (직접 DB 업데이트) ===" 
echo "📝 코드 '$FIRST_CODE'를 활성화 상태로 변경"

# 활성화 API가 없으므로 재생성으로 활성화
REGENERATE_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/attendance/code" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": $FIRST_USER_ID, \"academyId\": 1}" \
  -s)

echo "$REGENERATE_RESPONSE" | jq '.'

NEW_CODE=$(echo "$REGENERATE_RESPONSE" | jq -r '.code // empty')

if [ -n "$NEW_CODE" ] && [ "$NEW_CODE" != "null" ]; then
  ATTENDANCE_CODE="$NEW_CODE"
  echo ""
  echo "✅ 새 출석 코드 생성됨: $ATTENDANCE_CODE"
else
  # 기존 코드 사용
  ATTENDANCE_CODE="$FIRST_CODE"
  echo ""
  echo "⚠️ 기존 코드 사용: $ATTENDANCE_CODE"
fi

echo ""
echo "=== 3단계: users 테이블에서 userId=$FIRST_USER_ID 확인 ==="
USER_SCHEMA=$(curl -X GET "https://suplacestudy.com/api/admin/check-users-schema" -s)
USER_EXISTS=$(echo "$USER_SCHEMA" | jq ".sampleData[] | select(.id == $FIRST_USER_ID)")

if [ -n "$USER_EXISTS" ]; then
  echo "✅ userId=$FIRST_USER_ID 가 users 테이블에 존재함"
  echo "$USER_EXISTS" | jq '{id, name, email, role}'
else
  echo "❌ userId=$FIRST_USER_ID 가 users 테이블에 없음!"
  echo "문제: student_attendance_codes의 userId가 users 테이블과 매칭되지 않음"
fi

echo ""
echo "=== 4단계: 출석 코드로 출석 인증 시도 ==="
echo "코드: $ATTENDANCE_CODE"

VERIFY_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$ATTENDANCE_CODE\"}" \
  -s)

echo "$VERIFY_RESPONSE" | jq '.'

if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ 출석 인증 성공!"
  
  VERIFIED_STUDENT_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.student.id')
  
  echo ""
  echo "=== 5단계: 출석 기록 확인 ==="
  STATS_RESPONSE=$(curl -X GET "https://suplacestudy.com/api/attendance/statistics?userId=$VERIFIED_STUDENT_ID&role=STUDENT" -s)
  
  TODAY=$(date +%Y-%m-%d)
  TODAYS_ATTENDANCE=$(echo "$STATS_RESPONSE" | jq -r ".calendar[\"$TODAY\"]")
  
  echo "오늘 출석 상태: $TODAYS_ATTENDANCE"
  
  if [ "$TODAYS_ATTENDANCE" != "null" ] && [ -n "$TODAYS_ATTENDANCE" ]; then
    echo "✅ 출석 기록이 정상적으로 저장됨!"
  else
    echo "⚠️ 출석 기록을 찾을 수 없음"
  fi
  
  echo ""
  echo "=== 6단계: RAG 챗봇 테스트 ==="
  RAG_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/ai-chat" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"출석은 어떻게 하나요?\",
      \"botId\": \"bot-1773803533575-qrn2pluec\",
      \"userId\": \"$VERIFIED_STUDENT_ID\",
      \"conversationHistory\": []
    }" \
    -s)
  
  if echo "$RAG_RESPONSE" | grep -q '"success":true'; then
    echo "✅ AI 챗봇 RAG 정상 작동"
    echo "응답 미리보기:"
    echo "$RAG_RESPONSE" | jq -r '.reply' | head -3
  else
    echo "❌ AI 챗봇 에러"
  fi
  
  echo ""
  echo "============================================="
  echo "✅ 전체 플로우 테스트 완료!"
  echo "============================================="
  
else
  echo ""
  echo "❌ 출석 인증 실패!"
  
  if echo "$VERIFY_RESPONSE" | grep -qi "학생 정보를 찾을 수 없습니다\|학생을 찾을 수 없음"; then
    echo ""
    echo "🔍 원인 분석:"
    echo "- student_attendance_codes.userId = $FIRST_USER_ID"
    echo "- users 테이블에 해당 ID 존재 여부: $([ -n "$USER_EXISTS" ] && echo '존재함' || echo '없음')"
    echo ""
    echo "해결 방법:"
    echo "1. users 테이블과 student_attendance_codes 테이블의 userId 동기화 필요"
    echo "2. 또는 실제 존재하는 userId로 출석 코드 재생성 필요"
  fi
fi

echo ""
