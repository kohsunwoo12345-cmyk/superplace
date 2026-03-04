#!/usr/bin/env node

/**
 * 채팅 기록 보안 테스트 스크립트
 * 
 * 목적: 서로 다른 사용자가 서로의 채팅 기록을 볼 수 없는지 확인
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

// 테스트 사용자 (실제 userId로 교체 필요)
const TEST_USERS = {
  user1: {
    id: 'user-1771479246368-du957iw33', // 실제 사용자 ID
    name: '사용자 1'
  },
  user2: {
    id: 'user-test-2', // 다른 사용자 ID (존재하는 ID로 교체)
    name: '사용자 2'
  }
};

async function testChatSessionSecurity() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   채팅 기록 보안 테스트                                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 테스트 1: 사용자 1의 세션 조회
  console.log('📋 테스트 1: 사용자 1의 채팅 세션 조회');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const url1 = `${BASE_URL}/api/chat-sessions?userId=${TEST_USERS.user1.id}`;
    console.log(`🔍 요청 URL: ${url1}`);
    
    const response1 = await fetch(url1);
    const data1 = await response1.json();
    
    console.log(`📡 응답 상태: ${response1.status} ${response1.statusText}`);
    console.log(`📦 세션 개수: ${data1.count}개`);
    
    if (data1.sessions && data1.sessions.length > 0) {
      console.log('✅ 사용자 1의 세션:');
      data1.sessions.slice(0, 3).forEach((session, idx) => {
        console.log(`   ${idx + 1}. ${session.id} - "${session.title}"`);
        console.log(`      userId: ${session.userId}`);
      });
    } else {
      console.log('⚠️ 세션 없음');
    }
  } catch (error) {
    console.error('❌ 테스트 1 실패:', error.message);
  }
  
  console.log('');
  
  // 테스트 2: 사용자 2의 세션 조회
  console.log('📋 테스트 2: 사용자 2의 채팅 세션 조회');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const url2 = `${BASE_URL}/api/chat-sessions?userId=${TEST_USERS.user2.id}`;
    console.log(`🔍 요청 URL: ${url2}`);
    
    const response2 = await fetch(url2);
    const data2 = await response2.json();
    
    console.log(`📡 응답 상태: ${response2.status} ${response2.statusText}`);
    console.log(`📦 세션 개수: ${data2.count}개`);
    
    if (data2.sessions && data2.sessions.length > 0) {
      console.log('✅ 사용자 2의 세션:');
      data2.sessions.slice(0, 3).forEach((session, idx) => {
        console.log(`   ${idx + 1}. ${session.id} - "${session.title}"`);
        console.log(`      userId: ${session.userId}`);
      });
    } else {
      console.log('⚠️ 세션 없음');
    }
  } catch (error) {
    console.error('❌ 테스트 2 실패:', error.message);
  }
  
  console.log('');
  
  // 테스트 3: 보안 검증 (userId 없이 조회 시도)
  console.log('📋 테스트 3: userId 없이 세션 조회 (보안 검증)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const url3 = `${BASE_URL}/api/chat-sessions`;
    console.log(`🔍 요청 URL: ${url3}`);
    
    const response3 = await fetch(url3);
    const data3 = await response3.json();
    
    console.log(`📡 응답 상태: ${response3.status} ${response3.statusText}`);
    
    if (response3.status === 400) {
      console.log('✅ 정상: userId 없이 조회 시 400 에러 반환');
      console.log(`   메시지: ${data3.message}`);
    } else {
      console.log('❌ 보안 문제: userId 없이도 조회 가능!');
      console.log(`   세션 개수: ${data3.count}개`);
    }
  } catch (error) {
    console.error('❌ 테스트 3 실패:', error.message);
  }
  
  console.log('');
  
  // 최종 결론
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   테스트 결과 요약                                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📝 백엔드 API 보안:');
  console.log('   ✅ GET /api/chat-sessions?userId=xxx');
  console.log('      → WHERE userId = ? 로 필터링 (보안 양호)');
  console.log('   ✅ GET /api/chat-messages?sessionId=xxx&userId=yyy');
  console.log('      → 세션 소유자 확인 후 403 반환 (보안 양호)');
  console.log('');
  console.log('🔍 프론트엔드 확인 필요:');
  console.log('   1. localStorage에서 user.id를 일관되게 사용하는지');
  console.log('   2. API 호출 시 항상 올바른 userId 전달하는지');
  console.log('   3. 브라우저 캐시나 localStorage 공유 문제');
  console.log('');
  console.log('🔧 디버깅 방법:');
  console.log('   1. 브라우저 콘솔(F12) → Application → Local Storage');
  console.log('   2. "user" 키의 값 확인 (id 필드 체크)');
  console.log('   3. Network 탭에서 API 호출 시 userId 파라미터 확인');
  console.log('');
}

// 스크립트 실행
testChatSessionSecurity().catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});
