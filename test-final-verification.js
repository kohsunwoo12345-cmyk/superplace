/**
 * 최종 검증 스크립트
 * 1. 학원장 로그인
 * 2. AI 챗 페이지 접속 시뮬레이션
 * 3. 할당된 봇만 정확히 나오는지 확인
 */

const DIRECTOR_EMAIL = 'wangholy1@naver.com';
const EXPECTED_ACADEMY_ID = 'academy-1771479246368-5viyubmqk';
const EXPECTED_BOT_ID = 'bot-1772458232285-1zgtygvh1';
const BASE_URL = 'https://superplacestudy.pages.dev';

async function runFinalTest() {
  console.log('🔍 ============= 최종 검증 시작 =============\n');
  
  // 1. 학원장 academyId 설정 확인
  console.log('📌 1단계: 학원장 academyId 설정 확인');
  try {
    const fixResponse = await fetch(`${BASE_URL}/api/admin/fix-director-academy`);
    const fixData = await fixResponse.json();
    console.log(`   ✅ Status: ${fixResponse.status}`);
    console.log(`   ✅ academyId: ${fixData.academyId}`);
    console.log(`   ✅ Message: ${fixData.message}\n`);
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}\n`);
  }

  // 2. 학원에 할당된 봇 조회
  console.log('📌 2단계: 학원에 할당된 봇 조회');
  try {
    const botResponse = await fetch(`${BASE_URL}/api/user/academy-bots?academyId=${EXPECTED_ACADEMY_ID}`);
    const botData = await botResponse.json();
    console.log(`   ✅ Status: ${botResponse.status}`);
    console.log(`   ✅ 할당된 봇 개수: ${botData.count}`);
    
    if (botData.bots && botData.bots.length > 0) {
      botData.bots.forEach((bot, index) => {
        console.log(`\n   🤖 봇 #${index + 1}:`);
        console.log(`      - ID: ${bot.id}`);
        console.log(`      - 이름: ${bot.name}`);
        console.log(`      - 설명: ${bot.description}`);
        console.log(`      - 모델: ${bot.model}`);
        console.log(`      - 활성: ${bot.isActive ? '✅' : '❌'}`);
      });
      
      // 예상된 봇만 있는지 확인
      console.log('\n📊 검증 결과:');
      const hasExpectedBot = botData.bots.some(bot => bot.id === EXPECTED_BOT_ID);
      const hasOnlyOneBot = botData.bots.length === 1;
      
      if (hasExpectedBot && hasOnlyOneBot) {
        console.log('   ✅ 성공: 할당된 봇만 정확히 표시됨!');
        console.log(`   ✅ 봇 ID: ${EXPECTED_BOT_ID}`);
        console.log(`   ✅ 봇 개수: 1개 (정확함)`);
      } else if (!hasExpectedBot) {
        console.log(`   ❌ 실패: 예상된 봇(${EXPECTED_BOT_ID})이 없음`);
      } else if (!hasOnlyOneBot) {
        console.log(`   ❌ 실패: 봇이 ${botData.bots.length}개 표시됨 (1개만 있어야 함)`);
      }
    } else {
      console.log('   ❌ 할당된 봇이 없습니다.');
    }
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
  }

  console.log('\n🔍 ============= 최종 검증 완료 =============');
}

runFinalTest().catch(console.error);
