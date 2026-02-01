// 봇 찾기 시뮬레이션

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateBotFind() {
  try {
    console.log('=== 봇 찾기 시뮬레이션 ===\n');
    
    // 1. API 응답 시뮬레이션
    const dbBots = await prisma.aIBot.findMany({
      where: { isActive: true },
      select: {
        id: true,
        botId: true,
        name: true,
        nameEn: true,
        description: true,
        icon: true,
        color: true,
        bgGradient: true,
        systemPrompt: true,
      },
    });
    
    // API 응답 형식으로 변환
    const convertedDbBots = dbBots.map((bot) => ({
      id: bot.botId,  // ← 중요: botId를 id로 사용
      name: bot.name,
      nameEn: bot.nameEn,
      description: bot.description,
      icon: bot.icon,
      color: bot.color,
      bgGradient: bot.bgGradient,
      systemPrompt: bot.systemPrompt,
      source: "database",
    }));
    
    console.log('📡 API 응답 (convertedDbBots):');
    convertedDbBots.forEach(bot => {
      console.log(`  - id: "${bot.id}", name: "${bot.name}"`);
    });
    
    console.log('\n');
    
    // 2. 채팅 페이지에서의 봇 찾기 시뮬레이션
    const gemId = 'ㅁㄴ';  // URL에서 가져온 값
    console.log(`🔍 URL gemId: "${gemId}"`);
    
    const foundGem = convertedDbBots.find((bot) => bot.id === gemId);
    
    if (foundGem) {
      console.log('✅ 봇 찾기 성공!');
      console.log(`   이름: ${foundGem.name}`);
      console.log(`   설명: ${foundGem.description}`);
      console.log(`   아이콘: ${foundGem.icon}`);
    } else {
      console.log('❌ 봇을 찾을 수 없음!');
      console.log('   사용 가능한 봇 ID:', convertedDbBots.map(b => `"${b.id}"`).join(', '));
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateBotFind();
