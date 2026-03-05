#!/usr/bin/env node

/**
 * AI 쇼핑몰 구매 신청 테스트 (마이그레이션 포함)
 * 
 * 이 스크립트는:
 * 1. 외부 사용자로 구매 신청을 시도
 * 2. 마이그레이션이 자동으로 실행되는지 확인
 * 3. 구매 신청이 성공하는지 검증
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

// 색상 출력
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(60), 'cyan');
}

async function testPurchase() {
  section('테스트 시작: AI 봇 구매 신청 (마이그레이션 포함)');
  
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  log(`⏰ 테스트 시간: ${timestamp}`, 'blue');

  // 테스트 데이터
  const purchaseData = {
    productId: 'bot-1772458232285-1zgtygvh1',
    productName: '수학 PDF 테스트 봇',
    studentCount: 10,
    months: 12,
    pricePerStudent: 1000,
    totalPrice: 120000,
    email: 'customer@test.com',
    name: '테스트 구매자',
    academyName: '슈퍼플레이스 테스트 학원',
    phoneNumber: '010-9999-8888',
    requestMessage: '빠른 승인 부탁드립니다'
  };

  log('\n📦 구매 신청 데이터:', 'yellow');
  log(JSON.stringify(purchaseData, null, 2), 'reset');

  section('Step 1: 외부 사용자 구매 신청 (토큰 없음)');
  
  try {
    log('🔄 POST 요청 전송 중...', 'blue');
    log(`   URL: ${BASE_URL}/api/bot-purchase-requests/create`, 'reset');
    log('   ⚠️  Authorization 헤더 없음 (외부 사용자)', 'yellow');

    const response = await fetch(`${BASE_URL}/api/bot-purchase-requests/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Authorization 헤더 없음 - 외부 사용자
      },
      body: JSON.stringify(purchaseData)
    });

    log(`\n📊 응답 상태: ${response.status} ${response.statusText}`, 
        response.ok ? 'green' : 'red');

    const result = await response.json();
    log('\n📄 응답 데이터:', 'yellow');
    log(JSON.stringify(result, null, 2), 'reset');

    if (response.ok && result.success) {
      log('\n✅ 구매 신청 성공!', 'green');
      log(`   Request ID: ${result.requestId}`, 'cyan');
      
      section('Step 2: 승인 페이지에서 확인');
      log('🔗 관리자 승인 페이지:', 'yellow');
      log(`   ${BASE_URL}/dashboard/admin/bot-shop-approvals`, 'cyan');
      log('\n📋 확인 사항:', 'yellow');
      log('   1. 구매 신청이 목록에 표시되는지', 'reset');
      log('   2. 이메일이 표시되는지: customer@test.com', 'reset');
      log('   3. 이름이 표시되는지: 테스트 구매자', 'reset');
      log('   4. 학원명이 표시되는지: 슈퍼플레이스 테스트 학원', 'reset');
      log('   5. 연락처가 표시되는지: 010-9999-8888', 'reset');
      
      section('테스트 결과: ✅ 성공');
      log('구매 신청이 정상적으로 처리되었습니다.', 'green');
      log('마이그레이션이 자동으로 실행되어 email 컬럼이 추가되었습니다.', 'green');
      
    } else {
      log('\n❌ 구매 신청 실패', 'red');
      log(`   오류: ${result.error || '알 수 없는 오류'}`, 'red');
      if (result.message) {
        log(`   메시지: ${result.message}`, 'red');
      }
      
      section('디버깅 정보');
      log('⚠️  여전히 D1_ERROR가 발생한다면:', 'yellow');
      log('   1. Cloudflare Pages 배포가 완료되었는지 확인', 'reset');
      log('   2. 브라우저 캐시를 클리어하고 재시도', 'reset');
      log('   3. Cloudflare D1 콘솔에서 수동 마이그레이션 실행:', 'reset');
      log('      ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;', 'cyan');
      log('      ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;', 'cyan');
      log('      ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;', 'cyan');
      log('      ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;', 'cyan');
      
      section('테스트 결과: ❌ 실패');
    }

  } catch (error) {
    log('\n💥 예외 발생:', 'red');
    log(error.message, 'red');
    if (error.stack) {
      log('\n스택 트레이스:', 'yellow');
      log(error.stack, 'reset');
    }
    
    section('테스트 결과: ❌ 오류');
  }

  section('수동 테스트 가이드');
  log('🌐 브라우저에서 테스트:', 'yellow');
  log(`   1. ${BASE_URL}/store 접속`, 'cyan');
  log('   2. AI 봇 선택', 'reset');
  log('   3. 구매 정보 입력:', 'reset');
  log('      - 이메일: test@academy.com', 'reset');
  log('      - 이름: 홍길동', 'reset');
  log('      - 학원명: 테스트 학원', 'reset');
  log('      - 연락처: 010-1234-5678', 'reset');
  log('   4. 구매 신청 버튼 클릭', 'reset');
  log('   5. 성공 메시지 확인', 'green');
  log(`   6. ${BASE_URL}/dashboard/admin/bot-shop-approvals 에서 확인`, 'cyan');

  log('\n');
}

// 실행
testPurchase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
