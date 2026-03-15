#!/usr/bin/env node

/**
 * 🔍 사용자 데이터 확인 스크립트
 * 
 * 실제 DB에 어떤 사용자 데이터가 있는지 확인합니다.
 */

const SITE_URL = 'https://superplacestudy.pages.dev';

// ANSI 색상 코드
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

async function checkUsers() {
  section('🔍 사용자 데이터 확인');

  // ========================================
  // Step 1: /api/debug-users 호출 (인증 불필요)
  // ========================================
  section('Step 1: 디버그 API로 사용자 확인');
  
  log('📋 /api/debug-users 호출 중...', 'blue');
  const debugResponse = await fetch(`${SITE_URL}/api/debug-users`);

  if (!debugResponse.ok) {
    log('❌ 디버그 API 호출 실패!', 'red');
    const errorText = await debugResponse.text();
    console.log('Error:', errorText);
  } else {
    const debugData = await debugResponse.json();
    log(`✅ 디버그 API 응답:`, 'green');
    console.log(JSON.stringify(debugData, null, 2));
    
    if (debugData.users && Array.isArray(debugData.users)) {
      log(`\n📊 총 사용자 수: ${debugData.users.length}명`, 'cyan');
      
      // 역할별 집계
      const roleCount = debugData.users.reduce((acc, u) => {
        const role = u.role || 'UNKNOWN';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      
      log(`\n📊 역할별 사용자 수:`, 'cyan');
      Object.entries(roleCount).forEach(([role, count]) => {
        log(`   ${role}: ${count}명`, 'cyan');
      });
      
      // 샘플 사용자 정보
      log(`\n📊 샘플 사용자 (최대 5명):`, 'cyan');
      debugData.users.slice(0, 5).forEach((u, idx) => {
        log(`   ${idx + 1}. ${u.name || 'N/A'} (${u.email}) - 역할: ${u.role || 'N/A'}, 학원ID: ${u.academyId || 'N/A'}`, 'cyan');
      });
    }
  }

  // ========================================
  // Step 2: /api/test-env 호출 (환경 확인)
  // ========================================
  section('Step 2: 환경 확인');
  
  log('🔧 /api/test-env 호출 중...', 'blue');
  const envResponse = await fetch(`${SITE_URL}/api/test-env`);

  if (!envResponse.ok) {
    log('❌ 환경 API 호출 실패!', 'red');
  } else {
    const envData = await envResponse.json();
    log(`✅ 환경 API 응답:`, 'green');
    console.log(JSON.stringify(envData, null, 2));
  }

  // ========================================
  // 최종 요약
  // ========================================
  section('📊 확인 완료');
  
  log('✅ 디버그 API로 실제 사용자 데이터 확인 완료', 'green');
  log('✅ 이 데이터를 기반으로 알림 테스트를 진행할 수 있습니다', 'green');
}

// 메인 실행
checkUsers()
  .then(() => {
    log('\n✅ 확인 완료!', 'green');
  })
  .catch((error) => {
    log('\n❌ 확인 중 오류 발생:', 'red');
    console.error(error);
  });
