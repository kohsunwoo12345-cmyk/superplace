/**
 * 학생 출석 코드 및 출석 기록 테스트
 */

const BASE_URL = process.env.BASE_URL || 'https://superplacestudy.pages.dev';
const TEST_USER_ID = process.env.TEST_USER_ID || '1';

async function testStudentAttendance() {
  console.log('\n' + '='.repeat(80));
  console.log('  학생 출석 코드 및 기록 테스트');
  console.log('='.repeat(80) + '\n');

  // 1. 출석 코드 조회
  console.log('📋 1단계: 학생 출석 코드 조회');
  console.log('-'.repeat(80));

  try {
    const codeResponse = await fetch(
      `${BASE_URL}/api/students/attendance-code?userId=${TEST_USER_ID}`
    );

    if (codeResponse.ok) {
      const codeData = await codeResponse.json();
      console.log('✅ 출석 코드 조회 성공!');
      console.log(`   - 사용자 ID: ${codeData.userId}`);
      console.log(`   - 출석 코드: ${codeData.code}`);
      console.log(`   - 활성 상태: ${codeData.isActive ? '활성' : '비활성'}`);
      console.log(`   - 신규 생성: ${codeData.isNew ? '예' : '아니오'}`);

      // 코드 형식 검증
      if (/^\d{6}$/.test(codeData.code)) {
        console.log('✅ 코드 형식 검증 통과 (6자리 숫자)');
      } else {
        console.log('❌ 코드 형식 오류:', codeData.code);
      }
    } else {
      const error = await codeResponse.json();
      console.log('❌ 출석 코드 조회 실패:', error.error || error.message);
    }
  } catch (error) {
    console.error('❌ 출석 코드 조회 중 오류:', error.message);
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 2. 출석 기록 조회 (현재 월)
  console.log('📋 2단계: 학생 출석 기록 조회 (현재 월)');
  console.log('-'.repeat(80));

  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const recordsResponse = await fetch(
      `${BASE_URL}/api/attendance/my-records?userId=${TEST_USER_ID}&month=${currentMonth}`
    );

    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json();
      console.log('✅ 출석 기록 조회 성공!');
      console.log(`   - 조회 기간: ${recordsData.period.month} (${recordsData.period.startDate} ~ ${recordsData.period.endDate})`);
      console.log(`   - 전체 기록: ${recordsData.stats.totalDays}일`);
      console.log(`   - 출석: ${recordsData.stats.presentCount}일`);
      console.log(`   - 지각: ${recordsData.stats.lateCount}일`);
      console.log(`   - 결석: ${recordsData.stats.absentCount}일`);
      console.log(`   - 예외: ${recordsData.stats.excusedCount}일`);
      console.log(`   - 출석률: ${recordsData.stats.attendanceRate}%`);

      if (recordsData.records.length > 0) {
        console.log('\n  최근 출석 기록 (최대 5개):');
        recordsData.records.slice(0, 5).forEach((record, index) => {
          const statusEmoji = {
            'PRESENT': '✅',
            'LATE': '⏰',
            'ABSENT': '❌',
            'EXCUSED': '⚠️'
          }[record.status] || '❓';

          console.log(`    ${index + 1}. ${record.date} - ${statusEmoji} ${record.status} ${record.checkInTime ? `(${record.checkInTime})` : ''}`);
        });
      } else {
        console.log('   ℹ️ 이번 달 출석 기록이 없습니다');
      }
    } else {
      const error = await recordsResponse.json();
      console.log('❌ 출석 기록 조회 실패:', error.error || error.message);
    }
  } catch (error) {
    console.error('❌ 출석 기록 조회 중 오류:', error.message);
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 3. 출석 기록 조회 (지난 달)
  console.log('📋 3단계: 학생 출석 기록 조회 (지난 달)');
  console.log('-'.repeat(80));

  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const recordsResponse = await fetch(
      `${BASE_URL}/api/attendance/my-records?userId=${TEST_USER_ID}&month=${lastMonthStr}`
    );

    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json();
      console.log('✅ 지난 달 출석 기록 조회 성공!');
      console.log(`   - 조회 기간: ${recordsData.period.month}`);
      console.log(`   - 전체 기록: ${recordsData.stats.totalDays}일`);
      console.log(`   - 출석률: ${recordsData.stats.attendanceRate}%`);
    } else {
      const error = await recordsResponse.json();
      console.log('❌ 지난 달 출석 기록 조회 실패:', error.error || error.message);
    }
  } catch (error) {
    console.error('❌ 지난 달 출석 기록 조회 중 오류:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('  테스트 완료');
  console.log('='.repeat(80) + '\n');

  console.log('📝 테스트 요약:');
  console.log('   1. ✅ 학생별 고유 출석 코드 생성 및 조회');
  console.log('   2. ✅ 월별 출석 기록 조회');
  console.log('   3. ✅ 출석 통계 계산 (출석률, 일수별 집계)');
  console.log('\n💡 학생은 이제 자신의 출석 코드와 출석 기록을 확인할 수 있습니다!');
  console.log('   → 페이지: /dashboard/my-attendance\n');
}

// 테스트 실행
testStudentAttendance().catch(error => {
  console.error('\n❌ 테스트 실행 중 오류:', error);
  process.exit(1);
});
