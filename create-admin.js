const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('admin123!@#', 10);

    // 관리자 계정 생성 또는 업데이트
    const admin = await prisma.user.upsert({
      where: { email: 'admin@superplace.com' },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        approved: true,
        name: 'System Administrator',
      },
      create: {
        email: 'admin@superplace.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        approved: true,
        name: 'System Administrator',
        points: 10000,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
      },
    });

    console.log('✅ 관리자 계정 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 이메일:', admin.email);
    console.log('🔑 비밀번호: admin123!@#');
    console.log('👤 이름:', admin.name);
    console.log('🎯 역할:', admin.role);
    console.log('💰 포인트:', admin.points);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('로그인 URL: /auth/signin');
  } catch (error) {
    console.error('❌ 에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
