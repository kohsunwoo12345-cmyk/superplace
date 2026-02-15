#!/bin/bash

echo "=========================================="
echo "학원장 대시보드 문제 정확한 진단"
echo "=========================================="
echo ""

echo "1. 데이터베이스 테이블 구조 확인"
echo "=========================================="
echo ""

echo "필요한 테이블들:"
echo "  - users (학생/교사 정보)"
echo "  - attendance (출석 데이터)"
echo "  - homework_submissions (숙제 제출)"
echo "  - classes (수업 정보)"
echo ""

echo "2. API 엔드포인트 확인"
echo "=========================================="
echo ""

# API 파일 존재 확인
if [ -f "functions/api/dashboard/director-stats.ts" ]; then
    echo "✅ functions/api/dashboard/director-stats.ts 존재"
else
    echo "❌ functions/api/dashboard/director-stats.ts 없음"
fi

echo ""
echo "API가 사용하는 테이블들:"
grep -n "FROM\|JOIN" functions/api/dashboard/director-stats.ts | head -20

echo ""
echo "3. 프론트엔드에서 API 호출 부분 확인"
echo "=========================================="
echo ""

# 대시보드 페이지에서 API 호출 부분 찾기
echo "src/app/dashboard/page.tsx에서 API 호출:"
grep -n "fetch\|/api/dashboard" src/app/dashboard/page.tsx | head -10

echo ""
echo "4. 학원장 계정이 필요한 데이터 확인"
echo "=========================================="
echo ""
echo "학원장 계정에 필요한 필드:"
echo "  - id (사용자 ID)"
echo "  - name (이름)"
echo "  - role (DIRECTOR)"
echo "  - academy_id 또는 academyId (학원 ID) ⚠️ 중요!"
echo ""

echo "5. localStorage에서 확인해야 할 것"
echo "=========================================="
echo ""
cat << 'JSCHECK'
// 브라우저 콘솔에서 실행:
const user = JSON.parse(localStorage.getItem('user'));
console.log('=== 사용자 정보 ===');
console.log('ID:', user.id);
console.log('Name:', user.name);
console.log('Role:', user.role);
console.log('Academy ID:', user.academy_id);
console.log('AcademyId:', user.academyId);
console.log('전체 객체:', user);

// Academy ID가 없으면 데이터를 불러올 수 없습니다!
if (!user.academy_id && !user.academyId) {
  console.error('❌ Academy ID가 없습니다!');
  console.error('학원장 계정에 academy_id가 설정되어 있지 않습니다.');
}
JSCHECK

echo ""
echo "6. 가장 가능성 높은 문제들"
echo "=========================================="
echo ""
echo "❌ 문제 1: attendance 테이블이 없거나 비어있음"
echo "   → 출석 데이터가 없으면 오늘 출석이 0으로 표시됨"
echo ""
echo "❌ 문제 2: homework_submissions 테이블이 없거나 비어있음"
echo "   → 숙제 제출 데이터가 없으면 숙제 관련 통계가 0으로 표시됨"
echo ""
echo "❌ 문제 3: 학원장 계정에 academy_id가 없음"
echo "   → API가 어떤 학원의 데이터를 가져와야 할지 모름"
echo "   → 모든 쿼리가 WHERE academy_id = ? 조건으로 실행됨"
echo ""
echo "❌ 문제 4: 학원에 학생이 없음"
echo "   → users 테이블에 role='STUDENT'이고 academy_id가 일치하는 학생이 없음"
echo ""

echo "7. 즉시 확인 방법"
echo "=========================================="
echo ""
echo "Step 1: 브라우저 콘솔 (F12) 열기"
echo "Step 2: 다음 코드 실행:"
echo ""
cat << 'APITEST'
const user = JSON.parse(localStorage.getItem('user'));
const academyId = user.academy_id || user.academyId;

console.log('👤 사용자:', user.name);
console.log('🏫 학원 ID:', academyId);

if (!academyId) {
  console.error('❌ 학원 ID가 없습니다! 학원장 계정에 academy_id를 설정해야 합니다.');
} else {
  console.log('📡 API 호출 중...');
  fetch(`/api/dashboard/director-stats?academyId=${academyId}&role=DIRECTOR`)
    .then(r => {
      console.log('📊 응답 상태:', r.status);
      return r.json();
    })
    .then(data => {
      console.log('✅ API 응답:', data);
      console.log('');
      console.log('📊 통계:');
      console.log('  전체 학생:', data.totalStudents);
      console.log('  전체 선생님:', data.totalTeachers);
      console.log('  오늘 출석:', data.todayStats?.attendance);
      console.log('  숙제 제출:', data.todayStats?.homeworkSubmitted);
      console.log('  숙제 미제출:', data.todayStats?.missingHomework);
      console.log('');
      console.log('📋 리스트:');
      console.log('  출석 알림:', data.attendanceAlerts?.length, '개');
      console.log('  검사 결과:', data.homeworkResults?.length, '개');
      console.log('  미제출 목록:', data.missingHomeworkList?.length, '개');
      
      // 문제 진단
      if (data.totalStudents === 0) {
        console.error('❌ 학원에 학생이 없습니다!');
        console.error('해결: /dashboard/students 페이지에서 학생을 추가하세요.');
      }
      if (data.todayStats?.attendance === 0) {
        console.warn('⚠️ 오늘 출석 기록이 없습니다.');
        console.warn('원인: attendance 테이블에 오늘 날짜 데이터가 없음');
      }
      if (data.todayStats?.homeworkSubmitted === 0) {
        console.warn('⚠️ 오늘 숙제 제출이 없습니다.');
        console.warn('원인: homework_submissions 테이블에 오늘 날짜 데이터가 없음');
      }
    })
    .catch(err => {
      console.error('❌ API 호출 실패:', err);
    });
}
APITEST

echo ""
echo "8. 다음 단계"
echo "=========================================="
echo ""
echo "위 코드를 실행한 후 결과를 알려주세요:"
echo "  1. 학원 ID가 있는지?"
echo "  2. API 응답에서 어떤 값들이 0인지?"
echo "  3. 콘솔에 어떤 에러 메시지가 있는지?"
echo ""
echo "이 정보로 정확한 문제를 파악할 수 있습니다!"
echo ""
echo "=========================================="

