const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateAssignment() {
  try {
    console.log('\n=== 봇 할당 활성화 ===\n');
    
    // botId가 'ㅁㄴ'인 할당을 찾아서 활성화
    const result = await prisma.botAssignment.updateMany({
      where: {
        botId: 'ㅁㄴ',
      },
      data: {
        isActive: true,
      },
    });
    
    console.log(`✅ ${result.count}개의 할당이 활성화되었습니다.`);
    
    // 확인
    const assignments = await prisma.botAssignment.findMany({
      where: {
        botId: 'ㅁㄴ',
      },
      select: {
        botId: true,
        isActive: true,
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      }
    });
    
    console.log('\n현재 상태:');
    assignments.forEach(a => {
      console.log(`  - ${a.user.name} (${a.user.role}): ${a.isActive ? '✅ 활성' : '❌ 비활성'}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAssignment();
