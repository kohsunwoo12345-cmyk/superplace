#!/usr/bin/env node

/**
 * 전체 구매-승인-봇할당 플로우 테스트
 * 
 * 1. 구매 신청 생성
 * 2. 승인 처리 (관리자 필요)
 * 3. AcademyBotSubscription 확인
 * 4. 봇 할당 확인
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

const colors = {
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
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
  log(`\n${'═'.repeat(70)}`, 'cyan');
  log(title, 'bright');
  log('═'.repeat(70), 'cyan');
}

async function testFullFlow() {
  section('🎯 전체 구매-승인-봇할당 플로우 테스트');

  // Step 1: 구매 신청
  section('Step 1: 구매 신청 생성');
  
  const purchaseData = {
    productId: 'bot-1772458232285-1zgtygvh1',
    productName: '수학 PDF 테스트 봇',
    studentCount: 20,
    months: 12,
    pricePerStudent: 1000,
    totalPrice: 240000,
    email: 'flow-test@academy.com',
    name: '플로우테스트',
    academyName: '플로우테스트학원',
    phoneNumber: '010-7777-8888',
    requestMessage: '전체 플로우 테스트입니다'
  };

  log('\n📦 구매 데이터:', 'yellow');
  log(`  제품: ${purchaseData.productName}`, 'reset');
  log(`  학생 수: ${purchaseData.studentCount}명`, 'reset');
  log(`  기간: ${purchaseData.months}개월`, 'reset');
  log(`  총액: ${purchaseData.totalPrice.toLocaleString()}원`, 'reset');

  let requestId = null;

  try {
    log('\n🔄 POST /api/bot-purchase-requests/create', 'blue');
    const createResponse = await fetch(`${BASE_URL}/api/bot-purchase-requests/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });

    const createResult = await createResponse.json();
    
    if (createResponse.ok && createResult.success) {
      requestId = createResult.requestId;
      log(`\n✅ 구매 신청 성공!`, 'green');
      log(`   Request ID: ${requestId}`, 'cyan');
    } else {
      log(`\n❌ 구매 신청 실패: ${createResult.error}`, 'red');
      return;
    }

  } catch (error) {
    log(`\n💥 오류: ${error.message}`, 'red');
    return;
  }

  // Step 2: 승인 테스트 가이드
  section('Step 2: 승인 처리 (관리자 필요)');

  log('\n⚠️  이 단계는 관리자 토큰이 필요합니다!', 'yellow');
  log('\n브라우저에서 다음을 실행하세요:', 'reset');
  log('\n1️⃣  관리자로 로그인', 'cyan');
  log('2️⃣  F12 → Console 탭 열기', 'cyan');
  log('3️⃣  다음 코드 실행:\n', 'cyan');

  const approveCode = `
// 승인 처리 테스트
const token = localStorage.getItem('token');
const requestId = '${requestId}';
const studentCount = ${purchaseData.studentCount};

console.log('🔑 Token:', token);
console.log('📝 Request ID:', requestId);

fetch('${BASE_URL}/api/admin/bot-purchase-requests/approve', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    requestId: requestId,
    studentCount: studentCount 
  })
})
.then(r => r.json())
.then(data => {
  console.log('📊 승인 응답:', data);
  if (data.success) {
    console.log('✅ 승인 성공!');
    console.log('구독 정보:', data.data.subscription);
    console.log('  - 총 학생 슬롯:', data.data.subscription.totalStudentSlots);
    console.log('  - 남은 슬롯:', data.data.subscription.remainingStudentSlots);
    console.log('  - 구독 종료일:', data.data.subscription.subscriptionEnd);
  } else {
    console.error('❌ 승인 실패:', data.error);
  }
});
`;

  log(approveCode, 'green');

  // Step 3: 구독 정보 확인 방법
  section('Step 3: AcademyBotSubscription 확인');

  log('\n승인 후 다음 정보를 확인하세요:', 'yellow');
  log('\n✓ totalStudentSlots: 20 (총 학생 슬롯)', 'reset');
  log('✓ remainingStudentSlots: 20 (남은 슬롯)', 'reset');
  log('✓ usedStudentSlots: 0 (사용된 슬롯)', 'reset');
  log('✓ subscriptionEnd: 현재 + 12개월', 'reset');

  // Step 4: 봇 할당 확인
  section('Step 4: 봇 할당 확인');

  log('\n🌐 봇 할당 페이지:', 'yellow');
  log(`   ${BASE_URL}/dashboard/admin/ai-bots/assign`, 'cyan');

  log('\n📋 확인 사항:', 'yellow');
  log('   1. 학원 선택 시 구독 정보 표시', 'reset');
  log('   2. "플로우테스트학원" 선택', 'reset');
  log('   3. 봇 목록에서 "수학 PDF 테스트 봇" 확인', 'reset');
  log('   4. 학생 할당 가능 여부 확인', 'reset');
  log('      - 20명까지 할당 가능', 'reset');
  log('      - 21명째는 슬롯 부족 오류', 'reset');

  // Step 5: 학생 봇 사용 확인
  section('Step 5: 학생 봇 사용 확인');

  log('\n🌐 AI 채팅 페이지:', 'yellow');
  log(`   ${BASE_URL}/ai-chat`, 'cyan');

  log('\n📋 확인 사항:', 'yellow');
  log('   1. 할당된 학생으로 로그인', 'reset');
  log('   2. "수학 PDF 테스트 봇" 표시 확인', 'reset');
  log('   3. 봇 선택 및 채팅 가능 확인', 'reset');
  log('   4. 구독 기간 만료 시 접근 차단 확인', 'reset');

  // Step 6: 제한 사항 테스트
  section('Step 6: 제한 사항 테스트');

  log('\n🔒 학생 수 제한:', 'yellow');
  log('   ✓ 20명까지 할당 성공', 'reset');
  log('   ✓ 21명째 할당 시 오류', 'reset');
  log('   ✓ 오류 메시지: "학생 슬롯이 부족합니다"', 'reset');

  log('\n📅 기간 제한:', 'yellow');
  log('   ✓ 구독 기간 내: 봇 사용 가능', 'reset');
  log('   ✓ 구독 만료 후: 봇 접근 차단', 'reset');
  log('   ✓ 오류 메시지: "구독이 만료되었습니다"', 'reset');

  log('\n🔄 재구매:', 'yellow');
  log('   ✓ 추가 구매 시 학생 수 누적', 'reset');
  log('   ✓ 기간 연장', 'reset');
  log('   ✓ 예: 10명 추가 구매 → 총 30명', 'reset');

  // 데이터베이스 확인 SQL
  section('Step 7: 데이터베이스 직접 확인 (Cloudflare D1)');

  log('\n📍 Cloudflare D1 콘솔에서 실행:', 'yellow');
  
  const sql = `
-- 1. 구매 요청 확인
SELECT id, productName, studentCount, months, status, 
       email, name, requestAcademyName, phoneNumber,
       createdAt, approvedAt
FROM BotPurchaseRequest
WHERE id = '${requestId}';

-- 2. 구독 정보 확인
SELECT academyId, productName,
       totalStudentSlots, usedStudentSlots, remainingStudentSlots,
       subscriptionStart, subscriptionEnd,
       createdAt, updatedAt
FROM AcademyBotSubscription
WHERE productId = '${purchaseData.productId}'
ORDER BY createdAt DESC
LIMIT 1;

-- 3. 학생 봇 할당 확인
SELECT s.id, s.name, s.email, 
       ab.botName, ab.botId, ab.assignedAt
FROM Student s
JOIN AssignedBot ab ON s.id = ab.studentId
WHERE ab.botId = '${purchaseData.productId}'
ORDER BY ab.assignedAt DESC;
`;

  log(sql, 'green');

  // 예상 결과
  section('📊 예상 결과');

  log('\n1️⃣  BotPurchaseRequest:', 'cyan');
  log('     status: APPROVED', 'reset');
  log('     studentCount: 20', 'reset');
  log('     months: 12', 'reset');
  log('     email: flow-test@academy.com', 'reset');

  log('\n2️⃣  AcademyBotSubscription:', 'cyan');
  log('     totalStudentSlots: 20', 'reset');
  log('     remainingStudentSlots: 20 → (할당 후 감소)', 'reset');
  log('     usedStudentSlots: 0 → (할당 후 증가)', 'reset');
  log('     subscriptionEnd: 현재 + 12개월', 'reset');

  log('\n3️⃣  할당된 학생들:', 'cyan');
  log('     최대 20명까지 할당 가능', 'reset');
  log('     각 학생은 봇 접근 권한 보유', 'reset');

  // 요약
  section('✅ 요약');

  log('\n구매 신청이 완료되었습니다!', 'green');
  log(`Request ID: ${requestId}`, 'cyan');
  log('\n다음 단계:', 'yellow');
  log('  1. 위의 브라우저 코드로 승인 처리', 'reset');
  log('  2. 승인 후 구독 정보 확인', 'reset');
  log('  3. 봇 할당 페이지에서 학생 할당', 'reset');
  log('  4. 학생 계정으로 봇 사용 테스트', 'reset');
  log('  5. 제한 사항 검증 (학생 수, 기간)', 'reset');
  log('');
}

testFullFlow().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
