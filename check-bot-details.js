const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBotDetails() {
  try {
    const bot = await prisma.aIBot.findFirst({
      where: {
        botId: 'ㅁㄴ',
      },
    });
    
    console.log('\n=== 봇 상세 정보 ===\n');
    console.log(JSON.stringify(bot, null, 2));

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBotDetails();
