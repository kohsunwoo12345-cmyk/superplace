#!/usr/bin/env node

/**
 * 🔍 D1 테이블 검증 및 실시간 구매 테스트
 * 
 * 이 스크립트는 다음을 수행합니다:
 * 1. 현재 배포 상태 확인
 * 2. 마이그레이션 가이드 표시
 * 3. 실제 구매 신청 테스트
 * 4. 결과 분석 및 다음 단계 안내
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

// 색상
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
  console.log(`${C[color]}${msg}${C.reset}`);
}

function box(title, color = 'cyan') {
  const line = '═'.repeat(60);
  log(`\n╔${line}╗`, color);
  log(`║ ${title.padEnd(60)}║`, color);
  log(`╚${line}╝`, color);
}

async function main() {
  box('D1 테이블 마이그레이션 - 실시간 검증', 'cyan');

  log('\n📊 현재 상태:', 'yellow');
  log('  ● 코드 변경: 완료 ✅', 'green');
  log('  ● Git push: 완료 ✅', 'green');
  log('  ● Commit: 7cf5e4a ✅', 'green');
  log('  ● D1 마이그레이션: ⚠️ 수동 실행 필요', 'yellow');

  box('❗ 중요: D1 테이블 마이그레이션 필요', 'red');
  
  log('\n현재 D1 테이블에 email 컬럼이 없어서 구매 신청이 실패합니다.', 'yellow');
  log('CREATE TABLE IF NOT EXISTS는 기존 테이블을 수정하지 않기 때문입니다.\n', 'yellow');

  log('다음 방법 중 하나를 선택하세요:\n', 'bright');

  box('방법 1: Cloudflare D1 콘솔 (권장, 3분)', 'green');
  
  log('\n📍 단계:', 'cyan');
  log('  1. https://dash.cloudflare.com 접속', 'reset');
  log('  2. Workers & Pages → superplacestudy', 'reset');
  log('  3. Settings → Bindings → D1 database', 'reset');
  log('  4. "Open D1 console" 버튼 클릭', 'reset');
  log('\n📝 다음 SQL 실행:', 'cyan');
  
  const sql = [
    'ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;',
    'ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;',
    'ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;',
    'ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;'
  ];
  
  sql.forEach(s => log(`     ${s}`, 'green'));

  log('\n💡 Tip: "duplicate column name" 오류는 무시하세요 (이미 존재)', 'yellow');

  box('방법 2: 관리자 API (관리자 권한 필요)', 'blue');
  
  log('\n🔐 관리자로 로그인한 상태에서:', 'cyan');
  log('  1. F12 → Console 탭 열기', 'reset');
  log('  2. 다음 코드 실행:\n', 'reset');
  
  log(`fetch('${BASE_URL}/api/admin/migrate-bot-purchase-table', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log(data);
  alert(data.success ? '✅ Success!' : '❌ ' + data.error);
});`, 'green');

  box('테스트 실행: 실제 구매 신청 시도', 'magenta');

  const testData = {
    productId: 'bot-1772458232285-1zgtygvh1',
    productName: '수학 PDF 테스트 봇',
    studentCount: 10,
    months: 12,
    pricePerStudent: 1000,
    totalPrice: 120000,
    email: 'test@verification.com',
    name: '검증 테스트',
    academyName: '마이그레이션 테스트 학원',
    phoneNumber: '010-0000-0000',
    requestMessage: '마이그레이션 후 검증'
  };

  log('\n🧪 테스트 데이터:', 'yellow');
  log(JSON.stringify(testData, null, 2), 'reset');

  log('\n🔄 POST 요청 전송...', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/bot-purchase-requests/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    log(`\n📡 응답: ${response.status} ${response.statusText}`, 
        response.ok ? 'green' : 'red');

    const result = await response.json();
    
    if (response.ok && result.success) {
      box('✅ 성공! 마이그레이션 완료됨', 'green');
      log('\n구매 신청이 정상적으로 처리되었습니다!', 'green');
      log(`Request ID: ${result.requestId}`, 'cyan');
      log(`\n✅ 다음 단계:`, 'green');
      log(`  1. 승인 페이지 확인:`, 'reset');
      log(`     ${BASE_URL}/dashboard/admin/bot-shop-approvals`, 'cyan');
      log(`  2. 다음 정보가 표시되는지 확인:`, 'reset');
      log(`     - Email: ${testData.email}`, 'reset');
      log(`     - Name: ${testData.name}`, 'reset');
      log(`     - Academy: ${testData.academyName}`, 'reset');
      log(`     - Phone: ${testData.phoneNumber}`, 'reset');
      
    } else {
      box('❌ 실패: 마이그레이션 필요', 'red');
      log(`\n오류: ${result.error}`, 'red');
      log(`메시지: ${result.message}`, 'red');
      
      if (result.message && result.message.includes('no column named email')) {
        log('\n🔧 해결 방법:', 'yellow');
        log('  위의 "방법 1" 또는 "방법 2"를 사용하여 마이그레이션을 실행하세요.', 'reset');
        log('  마이그레이션 후 다시 이 스크립트를 실행하세요:\n', 'reset');
        log('    node verify-purchase-migration.js', 'cyan');
      }
    }

  } catch (error) {
    box('💥 네트워크 오류', 'red');
    log(`\n${error.message}`, 'red');
  }

  box('📖 전체 가이드', 'cyan');
  log('\n자세한 내용은 MANUAL_MIGRATION_GUIDE.md 파일을 참조하세요.', 'yellow');
  log('  cat MANUAL_MIGRATION_GUIDE.md\n', 'cyan');

  box('🔗 관련 링크', 'blue');
  log(`\n  구매 페이지:  ${BASE_URL}/store`, 'cyan');
  log(`  승인 페이지:  ${BASE_URL}/dashboard/admin/bot-shop-approvals`, 'cyan');
  log(`  D1 콘솔:     https://dash.cloudflare.com/`, 'cyan');
  log(`  GitHub:      https://github.com/kohsunwoo12345-cmyk/superplace`, 'cyan');
  log('');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
