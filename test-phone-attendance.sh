#!/bin/bash

echo "=== 전화번호로 출석 테스트 ==="
echo ""

PHONE="010-5136-3624"
NORMALIZED="01051363624"

echo "📱 테스트 전화번호: $PHONE"
echo "📱 정규화된 번호: $NORMALIZED"
echo ""

# Cloudflare Pages 배포 대기
echo "⏳ Cloudflare Pages 배포 대기 (60초)..."
sleep 60
echo ""

# 1. 해당 전화번호로 학생이 있는지 확인
echo "1️⃣ 전화번호로 학생 조회 중..."
echo ""

# API 테스트 (인증 없이는 동작 안하므로 직접 테스트)
echo "🔍 다음 URL에서 테스트하세요:"
echo "   https://superplacestudy.pages.dev/attendance-verify"
echo ""
echo "📝 입력할 전화번호: 01051363624 (하이픈 없이)"
echo ""
echo "✅ 예상 동작:"
echo "   1. 전화번호 입력 → 출석 인증 버튼 클릭"
echo "   2. 학생 정보가 있으면 → 출석 완료 → 숙제 제출 페이지"
echo "   3. 학생 정보가 없으면 → '해당 전화번호로 등록된 학생을 찾을 수 없습니다.'"
echo ""
echo "🔍 F12 콘솔에서 확인할 로그:"
echo "   - '📱 전화번호로 출석 인증 요청: 01051363624'"
echo "   - '✅ 학생 발견: ...' 또는 '❌ 전화번호로 학생을 찾을 수 없음'"
echo ""

