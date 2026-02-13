#!/bin/bash

echo "=========================================="
echo "🏫 학원 상세 페이지 기능 추가"
echo "=========================================="

# 1. 타임스탬프 추가
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo ""
echo "📝 타임스탬프: $TIMESTAMP"

# 2. 변경 사항 요약
echo ""
echo "=========================================="
echo "📋 추가된 기능"
echo "=========================================="
echo ""
echo "✅ AI 봇 정보 탭:"
echo "   - 학원에 할당된 AI 봇 목록"
echo "   - 봇 이름, 설명, 할당일, 상태 표시"
echo ""
echo "✅ 결제내역 탭:"
echo "   - 총 결제액, 승인된 결제 수, 현재 요금제"
echo "   - 모든 결제 요청 및 승인 기록"
echo "   - 결제 상태별 색상 표시 (승인/대기/거절)"
echo ""
echo "✅ API 개선:"
echo "   - /api/admin/academies?id={academyId} 엔드포인트 추가"
echo "   - AI 봇 할당 정보 조회"
echo "   - 결제 내역 조회"
echo "   - 학생/선생님 createdAt 정보 추가"
echo ""

# 3. 빌드
echo "=========================================="
echo "🔨 프로젝트 빌드"
echo "=========================================="

npm run build

if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패"
  exit 1
fi

echo ""
echo "✅ 빌드 성공"

# 4. Git 커밋 및 푸시
echo ""
echo "=========================================="
echo "📦 Git 커밋 및 푸시"
echo "=========================================="

git add -A
git commit -m "feat: 학원 상세 페이지에 AI 봇 및 결제내역 탭 추가 (타임스탬프: $TIMESTAMP)"
git push origin main

echo ""
echo "=========================================="
echo "✅ 배포 완료"
echo "=========================================="
echo ""
echo "🌐 배포 URL: https://superplacestudy.pages.dev/dashboard/admin/academies/"
echo ""
echo "⏰ 배포 반영 예상 시간: 약 2-3분"
echo ""
echo "🔄 테스트 방법:"
echo "   1. https://superplacestudy.pages.dev/dashboard/admin/academies/ 접속"
echo "   2. 학원 목록에서 학원 클릭"
echo "   3. 상세 페이지에서 다음 탭 확인:"
echo "      • AI 봇: 할당된 AI 봇 목록"
echo "      • 결제내역: 결제 요청 및 승인 내역"
echo "      • 학생/선생님: 사용자 목록"
echo "      • 통계: AI 채팅 및 구독 정보"
echo ""

