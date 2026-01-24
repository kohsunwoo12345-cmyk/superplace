const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBots() {
  try {
    console.log('\n=== AI 봇 확인 ===\n');
    
    // 1. 데이터베이스의 모든 봇
    const dbBots = await prisma.aIBot.findMany({
      select: {
        id: true,
        botId: true,
        name: true,
        isActive: true,
        createdAt: true,
      }
    });
    
    console.log('📦 데이터베이스의 봇:');
    dbBots.forEach((bot, i) => {
      console.log(`  ${i + 1}. ${bot.name}`);
      console.log(`     botId: ${bot.botId}`);
      console.log(`     id: ${bot.id}`);
      console.log(`     활성화: ${bot.isActive ? '✅' : '❌'}`);
      console.log();
    });
    
    // 2. 봇 할당 정보
    const assignments = await prisma.botAssignment.findMany({
      select: {
        botId: true,
        userId: true,
        isActive: true,
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      }
    });
    
    console.log('🎯 봇 할당 정보:');
    assignments.forEach((assign, i) => {
      console.log(`  ${i + 1}. botId: ${assign.botId}`);
      console.log(`     사용자: ${assign.user.name} (${assign.user.role})`);
      console.log(`     활성화: ${assign.isActive ? '✅' : '❌'}`);
      console.log();
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBots();
