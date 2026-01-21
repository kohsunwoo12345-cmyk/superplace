const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@superplace.com' }
    });
    
    if (admin) {
      console.log('관리자 계정 정보:');
      console.log('ID:', admin.id);
      console.log('이메일:', admin.email);
      console.log('이름:', admin.name);
      console.log('역할:', admin.role);
      console.log('승인 상태:', admin.approved);
      
      if (!admin.approved) {
        console.log('\n⚠️  관리자 계정이 승인되지 않았습니다. 승인 처리 중...');
        const updated = await prisma.user.update({
          where: { email: 'admin@superplace.com' },
          data: { approved: true }
        });
        console.log('✅ 관리자 계정이 승인되었습니다.');
      } else {
        console.log('✅ 관리자 계정은 이미 승인되어 있습니다.');
      }
    } else {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
