#!/bin/bash

echo "🔍 랜딩페이지가 있는 사용자로 테스트"
echo "================================"
echo ""

# user_id 20640435의 이메일 확인
USER_EMAIL=$(curl -s "https://superplacestudy.pages.dev/api/debug/db-structure" | jq -r '.results.users.sample[] | select(.id == 20640435) | .email // empty')

if [ -z "$USER_EMAIL" ]; then
  echo "❌ user_id 20640435의 이메일을 찾을 수 없습니다."
  echo "샘플 데이터에 없으므로 admin@superplace.co.kr으로 테스트합니다."
  USER_EMAIL="admin@superplace.co.kr"
fi

TEST_DATA="{
  \"recipients\": [
    {
      \"studentEmail\": \"$USER_EMAIL\",
      \"parentName\": \"테스트 학부모\",
      \"parentPhone\": \"010-9999-8888\"
    }
  ]
}"

echo "📤 테스트 중..."
echo "   사용자 이메일: $USER_EMAIL"
echo ""

# API 호출
RESPONSE=$(curl -s -X POST \
  "https://superplacestudy.pages.dev/api/kakao/bulk-prepare" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📥 API 응답:"
echo "$RESPONSE" | jq '.'

echo ""
echo "================================"
echo ""

# 결과 분석
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
READY=$(echo "$RESPONSE" | jq -r '.stats.ready')

if [ "$SUCCESS" == "true" ] && [ "$READY" -gt 0 ]; then
  echo "✅ 성공! 랜딩페이지 자동 매칭 완료"
  echo ""
  echo "$RESPONSE" | jq -r '.recipients[] | select(.status == "READY") | "
📋 매칭 결과:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
학생 ID: \(.studentId)
학생 이메일: \(.studentEmail)
학생 이름: \(.studentName)
학부모 이름: \(.parentName)
학부모 연락처: \(.parentPhone)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
랜딩페이지 ID: \(.landingPageId)
랜딩페이지 제목: \(.landingPageTitle)
랜딩페이지 Slug: \(.landingPageSlug)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 고유 URL:
\(.landingPageUrl)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
생성 시간: \(.landingPageCreatedAt)
"'
else
  echo "⚠️  실패"
  echo "$RESPONSE" | jq -r '.recipients[0] | "상태: \(.status)\n오류: \(.error)"'
fi
