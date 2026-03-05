#!/usr/bin/env node

/**
 * 승인 페이지 표시 테스트
 * 
 * 이 스크립트는:
 * 1. 구매 신청 생성 테스트
 * 2. 승인 페이지 API 호출 테스트
 * 3. 데이터 표시 확인
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(70), 'cyan');
}

async function testApprovalPage() {
  section('승인 페이지 표시 테스트');

  // Test 1: 구매 신청 생성
  section('Step 1: 구매 신청 생성 (외부 사용자)');
  
  const purchaseData = {
    productId: 'bot-1772458232285-1zgtygvh1',
    productName: '수학 PDF 테스트 봇',
    studentCount: 15,
    months: 6,
    pricePerStudent: 1000,
    totalPrice: 90000,
    email: 'approval-test@test.com',
    name: '승인테스트',
    academyName: '승인테스트학원',
    phoneNumber: '010-5555-6666',
    requestMessage: '승인 페이지 표시 테스트'
  };

  log('\n📦 구매 데이터:', 'yellow');
  log(JSON.stringify(purchaseData, null, 2), 'reset');

  try {
    log('\n🔄 POST /api/bot-purchase-requests/create', 'blue');
    const createResponse = await fetch(`${BASE_URL}/api/bot-purchase-requests/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });

    log(`📡 응답: ${createResponse.status} ${createResponse.statusText}`, 
        createResponse.ok ? 'green' : 'red');

    const createResult = await createResponse.json();
    
    if (createResponse.ok && createResult.success) {
      log('\n✅ 구매 신청 성공!', 'green');
      log(`   Request ID: ${createResult.requestId}`, 'cyan');
    } else {
      log('\n⚠️  구매 신청 실패 (계속 진행)', 'yellow');
      log(`   오류: ${createResult.error}`, 'yellow');
    }

  } catch (error) {
    log(`\n⚠️  구매 신청 오류: ${error.message}`, 'yellow');
  }

  // Test 2: 승인 페이지 API 테스트
  section('Step 2: 승인 페이지 API 호출 테스트');

  log('\n⚠️  관리자 토큰이 필요합니다!', 'yellow');
  log('브라우저에서 다음을 실행하세요:\n', 'reset');
  
  log('1. 관리자로 로그인', 'cyan');
  log('2. F12 → Console 탭 열기', 'cyan');
  log('3. 다음 코드 실행:\n', 'cyan');

  const testCode = `
// 승인 페이지 API 테스트
const token = localStorage.getItem('token');
console.log('🔑 Token:', token);

fetch('${BASE_URL}/api/admin/bot-purchase-requests/list', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 응답:', data);
  if (data.success) {
    console.log('✅ 성공!');
    console.log('총 신청 건수:', data.data.stats.total);
    console.log('대기 중:', data.data.stats.pending);
    console.log('승인됨:', data.data.stats.approved);
    console.log('거절됨:', data.data.stats.rejected);
    console.log('\\n최근 신청 3건:');
    data.data.requests.slice(0, 3).forEach((req, i) => {
      console.log(\`\${i + 1}. \${req.productName} - \${req.name} (\${req.email}) - \${req.studentCount}명\`);
    });
  } else {
    console.error('❌ 실패:', data.error);
  }
});
`;

  log(testCode, 'green');

  section('Step 3: 수동 확인');
  log('\n🌐 승인 페이지 URL:', 'yellow');
  log(`   ${BASE_URL}/dashboard/admin/bot-shop-approvals`, 'cyan');
  
  log('\n📋 확인 사항:', 'yellow');
  log('   ✓ 구매 신청 목록이 표시되는지', 'reset');
  log('   ✓ 이메일이 표시되는지', 'reset');
  log('   ✓ 이름이 표시되는지', 'reset');
  log('   ✓ 학원명이 표시되는지', 'reset');
  log('   ✓ 연락처가 표시되는지', 'reset');
  log('   ✓ 학생 수가 표시되는지', 'reset');
  log('   ✓ 상태 필터가 작동하는지 (전체/대기중/승인됨/거절됨)', 'reset');

  section('문제 해결');
  
  log('\n❓ 승인 페이지에 아무것도 표시되지 않는다면:', 'yellow');
  log('   1. 관리자 계정으로 로그인했는지 확인', 'reset');
  log('   2. 브라우저 콘솔(F12)에서 오류 확인', 'reset');
  log('   3. localStorage.getItem(\'token\') 실행하여 토큰 확인', 'reset');
  log('   4. 위의 테스트 코드로 API 직접 호출', 'reset');

  log('\n❓ "Invalid token format" 오류가 나온다면:', 'yellow');
  log('   1. 로그아웃 후 다시 로그인', 'reset');
  log('   2. 토큰 형식: id|email|role|academyId', 'reset');
  log('   3. 예: "user123|admin@test.com|SUPER_ADMIN|academy456"', 'reset');

  log('\n❓ "Admin permission required" 오류가 나온다면:', 'yellow');
  log('   1. 계정 role이 ADMIN 또는 SUPER_ADMIN인지 확인', 'reset');
  log('   2. 데이터베이스에서 User 테이블 확인', 'reset');

  section('다음 단계');
  log('\n1️⃣  위의 브라우저 테스트 코드 실행', 'cyan');
  log('2️⃣  승인 페이지 접속하여 목록 확인', 'cyan');
  log('3️⃣  구매 신청 상세보기 클릭하여 모든 정보 확인', 'cyan');
  log('4️⃣  승인 또는 거절 테스트', 'cyan');
  log('');
}

testApprovalPage().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
