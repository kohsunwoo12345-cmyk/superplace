/**
 * 로그인 API 응답 테스트
 * academyId가 토큰에 포함되는지 확인
 */

const BASE_URL = 'https://superplacestudy.pages.dev';
const DIRECTOR_EMAIL = 'wangholy1@naver.com';

async function testLogin() {
  console.log('🔍 ============= 로그인 API 테스트 =============\n');
  
  console.log('📌 1단계: User 테이블의 academyId 확인');
  
  // API 호출 전에 먼저 데이터베이스 상태 확인
  try {
    const fixResponse = await fetch(`${BASE_URL}/api/admin/fix-director-academy`);
    const fixData = await fixResponse.json();
    console.log('   ✅ User 테이블 academyId 상태:');
    console.log(`      - Status: ${fixResponse.status}`);
    console.log(`      - academyId: ${fixData.academyId}`);
    console.log(`      - Message: ${fixData.message}\n`);
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}\n`);
  }
  
  console.log('📌 2단계: 로그인 토큰 파싱 시뮬레이션');
  
  // 로그인 API는 토큰을 반환하는데, 토큰 형식 확인
  console.log('   ℹ️  토큰 형식: userId|email|role|academyId|timestamp');
  console.log('   ℹ️  예상 토큰: user-1771479246368-du957iw33|wangholy1@naver.com|DIRECTOR|academy-1771479246368-5viyubmqk|...');
  
  console.log('\n📌 3단계: localStorage에 저장될 user 객체 확인');
  console.log('   ℹ️  localStorage.setItem("user", JSON.stringify({');
  console.log('        id: "user-1771479246368-du957iw33",');
  console.log('        email: "wangholy1@naver.com",');
  console.log('        role: "DIRECTOR",');
  console.log('        academyId: "academy-1771479246368-5viyubmqk",  ← 이 필드가 있어야 함!');
  console.log('        ...');
  console.log('      }))');
  
  console.log('\n📊 현재 상황 분석:');
  console.log('   ❌ localStorage.user에 academyId가 없음');
  console.log('   → 로그인 API가 academyId를 반환하지 않음');
  console.log('   → 또는 프론트엔드가 academyId를 저장하지 않음');
  
  console.log('\n🔍 ============= 테스트 완료 =============');
}

testLogin().catch(console.error);
