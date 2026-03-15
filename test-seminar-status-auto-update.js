#!/usr/bin/env node

/**
 * 🎓 세미나 상태 자동 업데이트 테스트
 * 
 * 테스트 항목:
 * 1. 과거 날짜 세미나 → status = 'completed' 자동 변경
 * 2. 미래 날짜 세미나 → status = 'upcoming' 유지
 * 3. 취소된 세미나 → status = 'cancelled' 유지
 */

const SITE_URL = 'https://superplacestudy.pages.dev';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

async function testSeminarStatusAutoUpdate() {
  section('🎓 세미나 상태 자동 업데이트 테스트');

  // ========================================
  // Step 1: 전체 세미나 조회 (인증 없이)
  // ========================================
  section('Step 1: 전체 세미나 조회');
  
  log('📋 /api/seminars 호출 중...', 'blue');
  const seminarsResponse = await fetch(`${SITE_URL}/api/seminars`);

  if (!seminarsResponse.ok) {
    log('❌ 세미나 조회 실패!', 'red');
    const errorText = await seminarsResponse.text();
    console.log('Error:', errorText);
    return;
  }

  const seminarsData = await seminarsResponse.json();
  const seminars = seminarsData.seminars || [];
  
  log(`✅ 총 ${seminars.length}개의 세미나 조회 완료`, 'green');

  if (seminars.length === 0) {
    log('⚠️ 세미나 데이터가 없습니다.', 'yellow');
    return;
  }

  // ========================================
  // Step 2: 각 세미나의 날짜/시간 vs 상태 확인
  // ========================================
  section('Step 2: 세미나 날짜/시간 및 상태 확인');

  const now = new Date();
  const kstOffset = 9 * 60;
  const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);

  log(`📅 현재 시간 (KST): ${kstNow.toISOString()}`, 'cyan');
  log('', 'reset');

  let correctCount = 0;
  let incorrectCount = 0;
  const incorrectSeminars = [];

  seminars.forEach((seminar, idx) => {
    log(`${idx + 1}. ${seminar.title}`, 'bright');
    log(`   세미나 날짜: ${seminar.date} ${seminar.time || 'N/A'}`, 'cyan');
    log(`   현재 상태: ${seminar.status}`, seminar.status === 'completed' ? 'yellow' : 'green');

    try {
      const seminarDateTime = new Date(`${seminar.date}T${seminar.time || '00:00'}:00+09:00`);
      const isPast = kstNow > seminarDateTime;

      log(`   세미나 시간: ${seminarDateTime.toISOString()}`, 'cyan');
      log(`   종료 여부: ${isPast ? '종료됨 (과거)' : '진행 예정 (미래)'}`, isPast ? 'yellow' : 'green');

      // 상태 검증
      if (seminar.status === 'cancelled') {
        log(`   ✅ 취소된 세미나 - 상태 유지`, 'green');
        correctCount++;
      } else if (isPast && seminar.status === 'completed') {
        log(`   ✅ 과거 세미나 - 상태 정확함 (completed)`, 'green');
        correctCount++;
      } else if (!isPast && (seminar.status === 'upcoming' || seminar.status === 'active')) {
        log(`   ✅ 미래 세미나 - 상태 정확함 (upcoming/active)`, 'green');
        correctCount++;
      } else if (isPast && seminar.status !== 'completed') {
        log(`   ❌ 과거 세미나인데 상태가 '${seminar.status}' (should be 'completed')`, 'red');
        incorrectCount++;
        incorrectSeminars.push({
          id: seminar.id,
          title: seminar.title,
          date: seminar.date,
          time: seminar.time,
          status: seminar.status,
          expectedStatus: 'completed'
        });
      } else if (!isPast && seminar.status === 'completed') {
        log(`   ❌ 미래 세미나인데 상태가 'completed' (should be 'upcoming')`, 'red');
        incorrectCount++;
        incorrectSeminars.push({
          id: seminar.id,
          title: seminar.title,
          date: seminar.date,
          time: seminar.time,
          status: seminar.status,
          expectedStatus: 'upcoming'
        });
      }
    } catch (dateError) {
      log(`   ⚠️ 날짜 파싱 실패: ${dateError.message}`, 'yellow');
    }

    log('', 'reset');
  });

  // ========================================
  // Step 3: 필터별 조회 테스트
  // ========================================
  section('Step 3: 필터별 조회 테스트');

  // 진행 예정 세미나
  log('📋 진행 예정 세미나 조회 (?status=upcoming)...', 'blue');
  const upcomingResponse = await fetch(`${SITE_URL}/api/seminars?status=upcoming`);
  if (upcomingResponse.ok) {
    const upcomingData = await upcomingResponse.json();
    log(`✅ 진행 예정: ${upcomingData.seminars?.length || 0}개`, 'green');
  }

  // 종료된 세미나
  log('📋 종료된 세미나 조회 (?status=completed)...', 'blue');
  const completedResponse = await fetch(`${SITE_URL}/api/seminars?status=completed`);
  if (completedResponse.ok) {
    const completedData = await completedResponse.json();
    log(`✅ 종료: ${completedData.seminars?.length || 0}개`, 'green');
  }

  // 취소된 세미나
  log('📋 취소된 세미나 조회 (?status=cancelled)...', 'blue');
  const cancelledResponse = await fetch(`${SITE_URL}/api/seminars?status=cancelled`);
  if (cancelledResponse.ok) {
    const cancelledData = await cancelledResponse.json();
    log(`✅ 취소: ${cancelledData.seminars?.length || 0}개`, 'green');
  }

  // ========================================
  // 최종 요약
  // ========================================
  section('📊 테스트 요약');

  log(`총 세미나 수: ${seminars.length}개`, 'cyan');
  log(`상태 정확함: ${correctCount}개`, 'green');
  log(`상태 부정확함: ${incorrectCount}개`, incorrectCount > 0 ? 'red' : 'green');

  if (incorrectCount > 0) {
    log('\n⚠️ 상태가 부정확한 세미나:', 'yellow');
    incorrectSeminars.forEach((s, idx) => {
      log(`${idx + 1}. ${s.title}`, 'yellow');
      log(`   ID: ${s.id}`, 'cyan');
      log(`   날짜: ${s.date} ${s.time}`, 'cyan');
      log(`   현재 상태: ${s.status}`, 'red');
      log(`   예상 상태: ${s.expectedStatus}`, 'green');
    });
  }

  log('\n🔧 수정 내용:', 'bright');
  log('   - 세미나 조회 시 날짜/시간을 현재 시간과 자동 비교', 'cyan');
  log('   - 과거 세미나는 자동으로 status = "completed"로 변경', 'cyan');
  log('   - 미래 세미나는 status = "upcoming" 유지', 'cyan');
  log('   - 취소된 세미나는 status = "cancelled" 유지', 'cyan');

  log('\n📝 다음 단계:', 'bright');
  log('   1. 브라우저에서 https://superplacestudy.pages.dev/dashboard/seminars/ 접속', 'yellow');
  log('   2. "전체" / "진행 예정" / "종료" 필터를 각각 클릭', 'yellow');
  log('   3. 각 세미나가 올바른 카테고리에 표시되는지 확인', 'yellow');
  log('   4. 과거 날짜 세미나가 "종료" 탭에 표시되는지 확인', 'yellow');
}

// 메인 실행
testSeminarStatusAutoUpdate()
  .then(() => {
    log('\n✅ 테스트 완료!', 'green');
  })
  .catch((error) => {
    log('\n❌ 테스트 중 오류 발생:', 'red');
    console.error(error);
  });
