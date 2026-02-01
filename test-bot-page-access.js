// 봇 페이지 접근 테스트

console.log('=== AI 봇 페이지 접근 테스트 ===\n');

// 1. 데이터베이스에서 봇 정보 확인
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBotAccess() {
  try {
    // 활성화된 봇 조회
    const bots = await prisma.aIBot.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        botId: true,
        name: true,
        nameEn: true,
        isActive: true,
      },
    });

    console.log('📦 활성화된 봇 목록:');
    bots.forEach((bot, index) => {
      console.log(`\n${index + 1}. ${bot.name} (${bot.nameEn})`);
      console.log(`   데이터베이스 ID: ${bot.id}`);
      console.log(`   봇 ID (URL 사용): ${bot.botId}`);
      console.log(`   활성화: ${bot.isActive ? '✅' : '❌'}`);
      console.log(`   접근 URL: /dashboard/ai-gems/${bot.botId}`);
    });

    console.log('\n\n=== 문제 진단 ===\n');
    
    // 2. AI Gems 페이지에서 사용하는 링크 확인
    console.log('AI Gems 페이지는 다음 형식으로 링크를 생성합니다:');
    console.log('  <Link href={`/dashboard/ai-gems/${bot.id}`}>');
    console.log('');
    console.log('여기서 bot.id는 API 응답의 id 필드입니다.');
    console.log('');
    
    // 3. API 응답 형식 확인
    console.log('📡 /api/ai-bots 응답 형식:');
    console.log('  convertedDbBots.map((bot) => ({');
    console.log('    id: bot.botId,  // ← 이것이 링크에 사용됨!');
    console.log('    name: bot.name,');
    console.log('    ...');
    console.log('  }))');
    console.log('');
    
    console.log('✅ 예상 동작:');
    bots.forEach((bot) => {
      console.log(`  - "${bot.name}" 클릭 시 → /dashboard/ai-gems/${bot.botId}`);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBotAccess();
