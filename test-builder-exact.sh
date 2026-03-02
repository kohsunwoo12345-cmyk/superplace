#!/bin/bash

echo "🎯 빌더 페이지 정확한 시뮬레이션"
echo ""

# 1. 템플릿 HTML 읽기 (빌더와 동일)
TEMPLATE_HTML=$(node -e "
const fs = require('fs');
const content = fs.readFileSync('src/templates/student-growth-report.ts', 'utf8');
const match = content.match(/export const STUDENT_GROWTH_REPORT_TEMPLATE = \`([\s\S]*?)\`;/);
if (match) {
  console.log(match[1]);
} else {
  console.error('Template not found');
  process.exit(1);
}
")

if [ $? -ne 0 ]; then
  echo "❌ 템플릿 읽기 실패"
  exit 1
fi

TEMPLATE_LENGTH=${#TEMPLATE_HTML}
echo "✅ 템플릿 HTML 로드 완료"
echo "📏 템플릿 길이: $TEMPLATE_LENGTH bytes"
echo ""

# 2. 테스트 토큰 생성
TEST_USER_ID="student-builder-test-$(date +%s)"
TEST_TOKEN="$TEST_USER_ID|test@builder.com|DIRECTOR|academy-1|$(date +%s)000"

echo "🔑 테스트 토큰: $TEST_TOKEN"
echo ""

# 3. Payload 생성 (빌더와 정확히 동일)
SLUG="builder_test_$(date +%s)"
TITLE="실제 빌더 시뮬레이션 테스트"

# JSON 이스케이프
ESCAPED_HTML=$(echo "$TEMPLATE_HTML" | jq -Rs .)
ESCAPED_TITLE=$(echo "$TITLE" | jq -Rs .)

PAYLOAD=$(cat <<PAYLOADJSON
{
  "slug": "$SLUG",
  "title": $ESCAPED_TITLE,
  "subtitle": "",
  "description": "",
  "templateType": "student_report",
  "templateHtml": $ESCAPED_HTML,
  "inputData": [],
  "ogTitle": $ESCAPED_TITLE,
  "ogDescription": "",
  "thumbnail": "",
  "folderId": "",
  "showQrCode": true,
  "qrCodePosition": "bottom",
  "pixelScripts": []
}
PAYLOADJSON
)

echo "📤 API 요청 전송 중..."
echo ""

# 4. API 호출
RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "📥 응답:"
echo "$RESPONSE" | jq .
echo ""

# 5. 성공 시 URL 확인
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  LP_SLUG=$(echo "$RESPONSE" | jq -r '.landingPage.slug // ""')
  LP_URL=$(echo "$RESPONSE" | jq -r '.landingPage.url // ""')
  
  echo "✅ 랜딩페이지 생성 성공!"
  echo "🔗 공개 URL: https://superplacestudy.pages.dev$LP_URL"
  echo ""
  
  # 6. 생성된 페이지 확인
  echo "🔍 생성된 페이지 검증 중..."
  sleep 2
  
  PAGE_CONTENT=$(curl -s "https://superplacestudy.pages.dev$LP_URL")
  
  if echo "$PAGE_CONTENT" | grep -q "학습 리포트"; then
    echo "✅ 페이지 렌더링 성공"
    
    if echo "$PAGE_CONTENT" | grep -q "출석 현황"; then
      echo "✅ 템플릿 적용 확인: 출석 현황 섹션 존재"
    fi
    
    if echo "$PAGE_CONTENT" | grep -q "과제 완수율"; then
      echo "✅ 템플릿 적용 확인: 과제 섹션 존재"
    fi
    
    if echo "$PAGE_CONTENT" | grep -q "AI 스마트 튜터링"; then
      echo "✅ 템플릿 적용 확인: AI 튜터 섹션 존재"
    fi
    
    echo ""
    echo "🎉 최종 URL: https://superplacestudy.pages.dev$LP_URL"
  else
    echo "❌ 페이지가 제대로 렌더링되지 않음"
  fi
else
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
  echo "❌ 랜딩페이지 생성 실패: $ERROR_MSG"
fi

