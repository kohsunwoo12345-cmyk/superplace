#!/usr/bin/env node

/**
 * AI 봇 구독 만료 자동 비활성화 테스트 스크립트
 * 
 * 사용법:
 * node test-bot-access-control.js
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

// 테스트 데이터
const TEST_DATA = {
  academyId: 'academy-1771479246368-5viyubmqk',
  botId: 'bot-1772458232285-1zgtygvh1',
  studentUserId: 'user-1771479246368-du957iw33', // 실제 학생 userId로 교체 필요
};

async function testBotAccessCheck() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   AI 봇 구독 만료 자동 비활성화 테스트                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 테스트 1: 봇 접근 권한 체크 API
  console.log('📋 테스트 1: 봇 접근 권한 체크 API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const url = `${BASE_URL}/api/user/bot-access-check?` +
      `userId=${TEST_DATA.studentUserId}&` +
      `botId=${TEST_DATA.botId}&` +
      `academyId=${TEST_DATA.academyId}`;
    
    console.log(`🔍 요청 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);
    console.log(`📦 응답 데이터:`, JSON.stringify(data, null, 2));
    
    if (data.hasAccess) {
      console.log('✅ 결과: 접근 가능');
      console.log(`   - 구독 만료일: ${data.subscription?.subscriptionEnd}`);
      console.log(`   - 전체 인원: ${data.subscription?.totalStudentSlots}명`);
      console.log(`   - 학생 순위: ${data.assignment?.studentRank}`);
    } else {
      console.log('❌ 결과: 접근 불가');
      console.log(`   - 사유: ${data.reason}`);
    }
  } catch (error) {
    console.error('❌ 테스트 1 실패:', error.message);
  }
  
  console.log('');
  
  // 테스트 2: 학원 봇 목록 조회
  console.log('📋 테스트 2: 학원 봇 목록 조회');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const url = `${BASE_URL}/api/user/academy-bots?academyId=${TEST_DATA.academyId}`;
    
    console.log(`🔍 요청 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);
    console.log(`📦 봇 개수: ${data.count}개`);
    
    if (data.bots && data.bots.length > 0) {
      console.log('✅ 할당된 봇:');
      data.bots.forEach((bot, index) => {
        console.log(`   ${index + 1}. ${bot.name} (${bot.id})`);
        console.log(`      - 모델: ${bot.model}`);
        console.log(`      - 활성: ${bot.isActive ? '예' : '아니오'}`);
      });
    } else {
      console.log('⚠️ 할당된 봇이 없습니다');
    }
  } catch (error) {
    console.error('❌ 테스트 2 실패:', error.message);
  }
  
  console.log('');
  
  // 테스트 요약
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   테스트 완료                                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📝 다음 단계:');
  console.log('   1. 브라우저에서 학생 계정으로 로그인');
  console.log('   2. AI 채팅 페이지 접속: ' + BASE_URL + '/ai-chat');
  console.log('   3. 브라우저 콘솔(F12)에서 권한 체크 로그 확인');
  console.log('   4. 메시지 전송하여 실시간 권한 체크 테스트');
  console.log('');
  console.log('📄 상세 테스트 가이드: BOT_ACCESS_CONTROL_TEST_GUIDE.md');
  console.log('');
}

// 스크립트 실행
testBotAccessCheck().catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});
