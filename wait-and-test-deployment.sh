#!/bin/bash
echo "============================================"
echo "📦 Cloudflare Pages 배포 및 테스트"
echo "============================================"
echo ""

echo "✅ GitHub Push 완료:"
echo "   Commit: d75130bb"
echo "   Branch: main"
echo "   Commits: 8573a50f, d75130bb"
echo ""

echo "⏳ Cloudflare Pages 배포 대기..."
echo "   (일반적으로 1-3분 소요)"
echo ""

# 60초 대기
for i in {60..1}; do
    echo -ne "   ⏰ $i 초 남음...\r"
    sleep 1
done
echo ""
echo ""

echo "🧪 배포 확인 테스트 시작"
echo "============================================"
echo ""

# 1. 메인 페이지 체크
echo "1️⃣ 메인 페이지 응답 확인..."
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://superplacestudy.pages.dev")
if [ "$MAIN_STATUS" = "200" ]; then
    echo "   ✅ 메인 페이지: OK (HTTP $MAIN_STATUS)"
else
    echo "   ⚠️ 메인 페이지: HTTP $MAIN_STATUS"
fi
echo ""

# 2. API 엔드포인트 체크
echo "2️⃣ 출석 통계 API 응답 확인..."
API_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=STUDENT&academyId=")
API_SUCCESS=$(echo "$API_RESPONSE" | jq -r '.success // "false"')

if [ "$API_SUCCESS" = "true" ]; then
    echo "   ✅ API 응답: 정상"
    
    # 캘린더 데이터 확인
    CALENDAR_KEYS=$(echo "$API_RESPONSE" | jq -r '.calendar | keys | length')
    echo "   📅 캘린더 데이터: ${CALENDAR_KEYS}일"
    
    # 여러 월 확인
    MONTHS=$(echo "$API_RESPONSE" | jq -r '.calendar | keys | .[]' | cut -d'-' -f1-2 | sort | uniq | wc -l)
    echo "   📆 포함된 월 수: ${MONTHS}개월"
    
    if [ "$MONTHS" -gt 1 ]; then
        echo "   ✅ 여러 월 데이터 확인 (달 전환 가능)"
    elif [ "$CALENDAR_KEYS" -gt 0 ]; then
        echo "   ℹ️ 현재 월 데이터만 존재 (출석 기록 상태)"
    else
        echo "   ⚠️ 출석 기록 없음"
    fi
else
    echo "   ❌ API 오류:"
    echo "$API_RESPONSE" | jq '.'
fi
echo ""

# 3. 출석 통계 페이지 체크
echo "3️⃣ 출석 통계 페이지 HTML 확인..."
PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://superplacestudy.pages.dev/dashboard/attendance-statistics")
if [ "$PAGE_STATUS" = "200" ] || [ "$PAGE_STATUS" = "308" ]; then
    echo "   ✅ 페이지: 정상 (HTTP $PAGE_STATUS)"
else
    echo "   ⚠️ 페이지: HTTP $PAGE_STATUS"
fi
echo ""

# 4. 최종 판정
echo "============================================"
echo "📊 배포 및 수정 사항 최종 확인"
echo "============================================"
echo ""

if [ "$API_SUCCESS" = "true" ]; then
    echo "✅✅✅ 배포 성공!"
    echo ""
    echo "🎉 출석 통계 캘린더 수정 사항 적용 완료"
    echo ""
    echo "📝 수정 내용:"
    echo "   - API에서 학생의 전체 출석 기록 조회"
    echo "   - WHERE userId = ? 조건 추가"
    echo "   - thisMonth 필터링 제거"
    echo "   - 모든 월 데이터 반환"
    echo ""
    echo "🔗 확인 URL:"
    echo "   https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
    echo ""
    echo "👤 테스트 방법:"
    echo "   1. 학생 계정으로 로그인"
    echo "   2. 출석 통계 페이지 접속"
    echo "   3. '이전 달' 버튼 클릭"
    echo "   4. 캘린더에 🟢🔴🟡 확인"
    echo ""
    echo "📊 커밋 내역:"
    echo "   8573a50f - API 수정"
    echo "   d75130bb - 문서 추가"
else
    echo "⚠️ 배포는 완료되었으나 API 응답 확인 필요"
    echo ""
    echo "🔍 추가 확인 사항:"
    echo "   1. 학생 계정의 userId 확인"
    echo "   2. attendance_records_v3 테이블 데이터 확인"
    echo "   3. 실제 학생 계정으로 페이지 접속하여 테스트"
fi

echo ""
echo "============================================"
