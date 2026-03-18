// Cloudflare D1 Database에서 실제 봇 ID 조회
const API_ENDPOINT = 'https://suplacestudy.com/api/admin/ai-bots';

async function getBots() {
  try {
    const response = await fetch(API_ENDPOINT);
    const data = await response.json();
    
    if (data.bots && Array.isArray(data.bots)) {
      console.log('📋 실제 봇 목록:');
      console.log('');
      
      data.bots.slice(0, 5).forEach((bot, idx) => {
        console.log(`${idx + 1}. ID: ${bot.id}`);
        console.log(`   이름: ${bot.name}`);
        console.log(`   활성화: ${bot.isActive ? '✅' : '❌'}`);
        console.log(`   지식베이스: ${bot.knowledgeBase ? '있음' : '없음'}`);
        console.log('');
      });
      
      // 테스트용 봇 ID 출력
      const activeBots = data.bots.filter(b => b.isActive);
      if (activeBots.length > 0) {
        console.log('🎯 테스트할 봇 ID:');
        console.log(activeBots[0].id);
      }
    } else {
      console.log('⚠️ 봇 데이터를 가져올 수 없습니다.');
      console.log('응답:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

getBots();
