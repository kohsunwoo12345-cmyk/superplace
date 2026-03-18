#!/bin/bash

echo "=== 실제 학생 출석 코드 표시 검증 ==="
echo ""

# Test student info
STUDENT_ID=157
STUDENT_CODE="STU-157-MM0QE1ZC"

echo "📋 테스트 학생 정보:"
echo "  - 학생 ID: $STUDENT_ID"
echo "  - 학생 코드: $STUDENT_CODE"
echo "  - 이름: 고선우"
echo ""

# 1. Check attendance code via API
echo "1️⃣ 출석 코드 API 조회..."
ATTENDANCE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$STUDENT_ID")
echo "Response: $ATTENDANCE_RESPONSE"
ATTENDANCE_CODE=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)
echo "  ✅ 출석 코드: $ATTENDANCE_CODE"
echo ""

# 2. Check student info API (what the frontend calls)
echo "2️⃣ 학생 정보 API 조회 (프론트엔드와 동일)..."
STUDENT_INFO_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/by-academy?id=$STUDENT_CODE")
echo "Response preview: ${STUDENT_INFO_RESPONSE:0:200}..."
NUMERIC_ID=$(echo "$STUDENT_INFO_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "  ✅ 숫자 ID 추출: $NUMERIC_ID"
echo ""

# 3. Verify the flow matches frontend logic
echo "3️⃣ 프론트엔드 로직 검증..."
if [ "$NUMERIC_ID" = "$STUDENT_ID" ]; then
    echo "  ✅ ID 일치: $NUMERIC_ID = $STUDENT_ID"
else
    echo "  ❌ ID 불일치: $NUMERIC_ID ≠ $STUDENT_ID"
    exit 1
fi
echo ""

# 4. Test the actual page URL
PAGE_URL="https://superplacestudy.pages.dev/dashboard/students/detail/?id=$STUDENT_CODE"
echo "4️⃣ 실제 페이지 URL:"
echo "  $PAGE_URL"
echo ""

# 5. Wait for deployment
echo "⏳ Cloudflare Pages 배포 대기 (30초)..."
sleep 30
echo ""

echo "✅ API 레벨 검증 완료"
echo ""
echo "📊 검증 결과 요약:"
echo "  - 학생 ID: $STUDENT_ID"
echo "  - 학생 코드: $STUDENT_CODE"
echo "  - 출석 코드: $ATTENDANCE_CODE"
echo "  - 숫자 ID 추출: $NUMERIC_ID"
echo "  - 페이지 URL: $PAGE_URL"
echo ""
echo "🔍 다음 단계: Playwright로 실제 브라우저 렌더링 확인..."

