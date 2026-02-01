const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('데이터베이스 연결 중...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`\n✅ 총 ${users.length}명의 사용자 발견:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   역할: ${user.role}`);
      console.log(`   승인: ${user.approved ? '✓' : '✗'}`);
      console.log(`   가입일: ${user.createdAt.toISOString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
