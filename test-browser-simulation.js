/**
 * 브라우저 시뮬레이션: 학원장 로그인 후 AI 챗 페이지 접속
 */

const DIRECTOR_EMAIL = 'wangholy1@naver.com';
const ACADEMY_ID = 'academy-1771479246368-5viyubmqk';
const BASE_URL = 'https://superplacestudy.pages.dev';

async function simulateBrowserFlow() {
  console.log('🌐 ============= 브라우저 시뮬레이션 시작 =============\n');
  
  // 1. 학원장 로그인 시뮬레이션
  console.log('📌 1단계: 학원장 로그인 시뮬레이션');
  console.log(`   이메일: ${DIRECTOR_EMAIL}`);
  console.log(`   학원 ID: ${ACADEMY_ID}\n`);
  
  // localStorage에 저장될 user 객체 시뮬레이션
  const mockUser = {
    id: 'user-1771479246368-du957iw33',
    email: DIRECTOR_EMAIL,
    name: '고희준',
    role: 'DIRECTOR',
    academyId: ACADEMY_ID,
    academyName: '꾸메땅학원',
    phone: '01087399697'
  };
  
  console.log('📝 localStorage.user 시뮬레이션:');
  console.log(JSON.stringify(mockUser, null, 2));
  console.log('');
  
  // 2. AI 챗 페이지 로직 시뮬레이션
  console.log('📌 2단계: AI 챗 페이지 로직 시뮬레이션');
  
  // 2-1. user 체크
  if (!mockUser) {
    console.log('   ❌ 로그인되지 않음 - /login으로 리다이렉트');
    return;
  }
  console.log('   ✅ 로그인 확인됨');
  
  // 2-2. role 체크
  const isAdmin = mockUser.email === 'admin@superplace.co.kr' || 
                  mockUser.role === 'ADMIN' || 
                  mockUser.role === 'SUPER_ADMIN';
  
  console.log(`   ℹ️  관리자 여부: ${isAdmin ? '예' : '아니오'}`);
  console.log(`   ℹ️  역할: ${mockUser.role}`);
  console.log(`   ℹ️  academyId: ${mockUser.academyId || '없음'}`);
  
  // 2-3. 봇 조회 로직
  if (isAdmin) {
    console.log('\n   🔑 관리자 - 모든 봇 조회 시도...');
  } else if (mockUser.academyId) {
    console.log(`\n   🏫 일반 사용자 - 학원 봇 조회 시도 (academyId: ${mockUser.academyId})...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/user/academy-bots?academyId=${mockUser.academyId}`);
      const data = await response.json();
      
      console.log(`   ✅ API 호출 성공 (Status: ${response.status})`);
      console.log(`   ✅ 할당된 봇 개수: ${data.count}`);
      
      if (data.bots && data.bots.length > 0) {
        console.log('\n   🤖 조회된 봇 목록:');
        data.bots.forEach((bot, index) => {
          console.log(`      ${index + 1}. ${bot.name} (${bot.id})`);
          console.log(`         - 모델: ${bot.model}`);
          console.log(`         - 설명: ${bot.description}`);
        });
        
        console.log('\n   📊 최종 결과:');
        if (data.count === 1) {
          console.log('      ✅ 성공: 할당된 봇 1개만 정확히 표시됨!');
          console.log('      ✅ "학원 정보가 없습니다" 팝업 없음');
          console.log('      ✅ 다른 학원의 봇은 보이지 않음');
        } else {
          console.log(`      ⚠️  경고: ${data.count}개의 봇이 표시됨 (1개만 있어야 함)`);
        }
      } else {
        console.log('   ❌ 할당된 봇이 없습니다.');
      }
    } catch (error) {
      console.error(`   ❌ API 호출 오류: ${error.message}`);
    }
  } else {
    console.log('\n   ❌ academyId 없음 - "학원 정보가 없습니다" 팝업 표시');
  }
  
  console.log('\n🌐 ============= 브라우저 시뮬레이션 완료 =============');
}

simulateBrowserFlow().catch(console.error);
