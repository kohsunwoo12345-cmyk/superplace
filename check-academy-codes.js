const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAcademies() {
  try {
    const academies = await prisma.academy.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log('\n=== 학원 목록 ===');
    console.log(`총 ${academies.length}개의 학원이 있습니다.\n`);
    
    academies.forEach((academy, index) => {
      console.log(`${index + 1}. ${academy.name}`);
      console.log(`   코드: ${academy.code}`);
      console.log(`   ID: ${academy.id}`);
      console.log(`   사용자 수: ${academy._count.users}명\n`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAcademies();
