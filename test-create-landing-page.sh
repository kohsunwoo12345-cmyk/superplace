#!/bin/bash

# 테스트 토큰 생성 (실제 사용자 ID 사용)
TOKEN="student-1772009466729-t1m724iba|test@example.com|DIRECTOR|academy-1|$(date +%s)000"

echo "🔐 Using token: $TOKEN"
echo ""

# 템플릿 HTML 읽기
TEMPLATE_HTML=$(cat src/templates/student-growth-report.ts | sed -n '/export const STUDENT_GROWTH_REPORT_TEMPLATE = `/,/^`;$/p' | sed '1d;$d')

TEMPLATE_LENGTH=${#TEMPLATE_HTML}
echo "📏 Template HTML length: $TEMPLATE_LENGTH"
echo ""

# API 요청 JSON 생성
cat > /tmp/landing-page-payload.json << PAYLOAD
{
  "slug": "test-$(date +%s)",
  "title": "TEST 학생 리포트 자동 생성",
  "subtitle": "",
  "description": "",
  "templateType": "student_report",
  "templateHtml": $(echo "$TEMPLATE_HTML" | jq -Rs .),
  "inputData": [],
  "ogTitle": "TEST 학생 리포트",
  "ogDescription": "",
  "thumbnail": "",
  "folderId": "",
  "showQrCode": true,
  "qrCodePosition": "bottom",
  "pixelScripts": []
}
PAYLOAD

echo "📤 Sending API request..."
echo ""

# API 호출
curl -s -X POST "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/landing-page-payload.json | jq .

