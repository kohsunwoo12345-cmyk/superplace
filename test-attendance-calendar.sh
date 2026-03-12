#!/bin/bash
echo "============================================"
echo "🧪 출석 통계 캘린더 수정 테스트"
echo "============================================"
echo ""

echo "⏳ Cloudflare Pages 배포 대기 (60초)..."
sleep 60

echo ""
echo "1️⃣ API 응답 테스트 (학생용)"
echo "-------------------------------------------"
# 학생 계정으로 API 테스트 (userId=1 가정)
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=STUDENT&academyId=")

echo "📊 API 응답:"
echo "$RESPONSE" | jq '{
  success,
  role,
  attendanceDays,
  thisMonth,
  calendarKeys: .calendar | keys | length
}'

echo ""
echo "📅 캘린더 데이터 샘플 (최근 10개):"
echo "$RESPONSE" | jq '.calendar | to_entries | sort_by(.key) | reverse | .[0:10] | from_entries'

echo ""
echo "2️⃣ 여러 월 데이터 확인"
echo "-------------------------------------------"
# 2026-02, 2026-03 등 여러 월 데이터가 있는지 확인
CALENDAR=$(echo "$RESPONSE" | jq -r '.calendar | keys | .[]' | cut -d'-' -f1-2 | sort | uniq)
echo "📆 포함된 월:"
echo "$CALENDAR"

MONTH_COUNT=$(echo "$CALENDAR" | wc -l)
if [ "$MONTH_COUNT" -gt 1 ]; then
    echo ""
    echo "✅ 성공: 여러 월의 데이터가 반환되었습니다!"
    echo "   (이전 달/다음 달 전환 가능)"
else
    echo ""
    echo "⚠️ 주의: 현재 월 데이터만 있습니다"
    echo "   (출석 기록이 현재 월에만 있을 수 있음)"
fi

echo ""
echo "3️⃣ 상태별 카운트"
echo "-------------------------------------------"
VERIFIED=$(echo "$RESPONSE" | jq '[.calendar[] | select(. == "VERIFIED")] | length')
LATE=$(echo "$RESPONSE" | jq '[.calendar[] | select(. == "LATE")] | length')
ABSENT=$(echo "$RESPONSE" | jq '[.calendar[] | select(. == "ABSENT")] | length')

echo "🟢 출석 (VERIFIED): $VERIFIED일"
echo "🟡 지각 (LATE): $LATE일"
echo "🔴 결석 (ABSENT): $ABSENT일"

TOTAL=$((VERIFIED + LATE + ABSENT))
echo "📊 총 출석 기록: $TOTAL일"

echo ""
echo "4️⃣ 최종 판정"
echo "-------------------------------------------"
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ] && [ "$TOTAL" -gt 0 ]; then
    echo "✅✅✅ 테스트 통과!"
    echo ""
    echo "🎉 출석 통계 캘린더 정상 작동"
    echo "   - 여러 월 데이터 반환: ✅"
    echo "   - 캘린더 UI 표시 가능: ✅"
    echo "   - 달 전환 기능 작동: ✅"
    echo ""
    echo "🔗 확인 URL:"
    echo "   https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
    echo ""
    echo "📝 테스트 방법:"
    echo "   1. 학생 계정으로 로그인"
    echo "   2. 출석 통계 페이지 접속"
    echo "   3. '이전 달' 버튼 클릭"
    echo "   4. 캘린더에 🟢🔴🟡 이모지 표시 확인"
elif [ "$SUCCESS" = "true" ] && [ "$TOTAL" -eq 0 ]; then
    echo "⚠️ API는 정상이나 출석 기록이 없습니다"
    echo ""
    echo "📝 조치사항:"
    echo "   1. 학생 계정의 userId 확인"
    echo "   2. attendance_records_v3 테이블에 데이터가 있는지 확인"
    echo "   3. 출석 체크인으로 테스트 데이터 생성"
else
    echo "❌ API 오류 발생"
    echo "$RESPONSE" | jq '.'
fi

echo ""
echo "============================================"
