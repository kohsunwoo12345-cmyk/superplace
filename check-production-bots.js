const fetch = require('node-fetch');

async function checkProductionBots() {
  try {
    console.log('🌐 프로덕션 AI 봇 목록 확인 중...\n');
    
    const response = await fetch('https://superplace-study.vercel.app/api/ai-bots', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    console.log('📊 응답 상태:', response.status, response.statusText);
    console.log('📋 응답 헤더:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    if (!response.ok) {
      const text = await response.text();
      console.log('\n❌ 오류 응답:', text.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    
    console.log('\n✅ 봇 목록 받기 성공!');
    console.log('\n📦 총 봇 개수:', data.bots?.length || 0);
    
    if (data.bots && data.bots.length > 0) {
      console.log('\n🤖 봇 목록:');
      data.bots.forEach((bot, index) => {
        console.log(`\n${index + 1}. ${bot.name} (${bot.nameEn})`);
        console.log(`   ID: ${bot.id}`);
        console.log(`   아이콘: ${bot.icon}`);
        console.log(`   출처: ${bot.source || 'N/A'}`);
        console.log(`   설명: ${bot.description?.substring(0, 50)}...`);
      });
      
      // 데이터베이스 봇 필터링
      const dbBots = data.bots.filter(bot => bot.source === 'database');
      console.log(`\n📊 커스텀 봇: ${dbBots.length}개`);
      console.log(`📊 기본 봇: ${data.bots.length - dbBots.length}개`);
      
      if (dbBots.length > 0) {
        console.log('\n🎨 커스텀 봇 상세:');
        dbBots.forEach(bot => {
          console.log(`\n  - ${bot.name}`);
          console.log(`    링크: https://superplace-study.vercel.app/dashboard/ai-gems/${bot.id}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

checkProductionBots();
