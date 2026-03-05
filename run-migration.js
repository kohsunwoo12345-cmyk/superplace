#!/usr/bin/env node

/**
 * BotPurchaseRequest 테이블 마이그레이션 실행
 * 관리자 토큰으로 마이그레이션 API 호출
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

// 여기에 실제 관리자 토큰을 입력하세요
const ADMIN_TOKEN = 'REPLACE_WITH_ACTUAL_ADMIN_TOKEN';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   BotPurchaseRequest 테이블 자동 마이그레이션                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

async function runMigration() {
  console.log('🔧 마이그레이션 시작...\n');
  
  if (ADMIN_TOKEN === 'REPLACE_WITH_ACTUAL_ADMIN_TOKEN') {
    console.error('❌ 오류: 관리자 토큰을 입력해주세요\n');
    console.log('📝 토큰 얻는 방법:');
    console.log('1. 관리자 계정으로 로그인');
    console.log('2. 브라우저 개발자 도구 → Console');
    console.log('3. 실행: localStorage.getItem("token")');
    console.log('4. 출력된 토큰을 복사하여 위 ADMIN_TOKEN 변수에 붙여넣기\n');
    return;
  }
  
  try {
    console.log(`🔍 요청 URL: ${BASE_URL}/api/admin/migrate-bot-purchase-table`);
    console.log(`🔑 토큰: ${ADMIN_TOKEN.substring(0, 20)}...`);
    console.log();
    
    const response = await fetch(`${BASE_URL}/api/admin/migrate-bot-purchase-table`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('\n✅ 마이그레이션 성공!\n');
      
      console.log('📊 실행 결과:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      data.results.forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. ${result.step}`);
        if (result.columns) {
          console.log(`   컬럼: ${result.columns.join(', ')}`);
        }
        if (result.note) {
          console.log(`   참고: ${result.note}`);
        }
        if (result.error) {
          console.log(`   ❌ 오류: ${result.error}`);
        }
        console.log(`   상태: ${result.success ? '✅ 성공' : '❌ 실패'}`);
      });
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ 다음 단계:');
      console.log('1. 쇼핑몰 페이지에서 구매 신청 재시도');
      console.log('2. 정상 작동 확인\n');
      
    } else {
      console.error('\n❌ 마이그레이션 실패!');
      console.error('에러:', data.error);
      
      if (response.status === 401) {
        console.error('\n🔒 인증 오류: 관리자 토큰이 유효하지 않습니다');
        console.error('해결: 새 토큰을 얻어서 ADMIN_TOKEN 변수를 업데이트하세요');
      } else if (response.status === 403) {
        console.error('\n🚫 권한 오류: 관리자 권한이 필요합니다');
        console.error('해결: ADMIN 또는 SUPER_ADMIN 계정으로 로그인하세요');
      }
      
      console.log();
    }
    
  } catch (error: any) {
    console.error('\n💥 네트워크 오류:', error.message);
    console.log();
  }
}

// 실행
(async () => {
  await runMigration();
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   테스트 완료                                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
})();
