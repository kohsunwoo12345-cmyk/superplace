const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createOrUpdateSuperAdmin() {
  console.log('🔧 SUPER_ADMIN 계정 생성/업데이트 시작...\n');

  const email = process.env.ADMIN_EMAIL || 'admin@superplace.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!';
  const name = process.env.ADMIN_NAME || '시스템 관리자';

  try {
    // 1. 기존 계정 확인
    console.log(`📋 이메일 확인: ${email}`);
    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
      }
    });

    if (existing) {
      console.log('✅ 기존 계정 발견:', existing);
      
      // SUPER_ADMIN이 아니거나 승인되지 않은 경우 업데이트
      if (existing.role !== 'SUPER_ADMIN' || !existing.approved) {
        console.log('🔄 SUPER_ADMIN 권한 부여 중...');
        
        const updated = await prisma.user.update({
          where: { email },
          data: {
            role: 'SUPER_ADMIN',
            approved: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            approved: true,
          }
        });
        
        console.log('✅ 계정 업데이트 완료:', updated);
      } else {
        console.log('✅ 이미 SUPER_ADMIN 권한이 있습니다.');
      }
    } else {
      // 2. 새 SUPER_ADMIN 계정 생성
      console.log('🆕 새 SUPER_ADMIN 계정 생성 중...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'SUPER_ADMIN',
          approved: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          approved: true,
          createdAt: true,
        }
      });
      
      console.log('✅ SUPER_ADMIN 계정 생성 완료:', admin);
    }

    // 3. 최종 확인
    console.log('\n📊 전체 사용자 통계:');
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });
    
    stats.forEach(stat => {
      console.log(`  - ${stat.role}: ${stat._count}명`);
    });

    const totalUsers = await prisma.user.count();
    const approvedUsers = await prisma.user.count({
      where: { approved: true }
    });
    
    console.log(`\n  전체: ${totalUsers}명`);
    console.log(`  승인: ${approvedUsers}명`);
    console.log(`  대기: ${totalUsers - approvedUsers}명`);

    // 4. 로그인 정보 출력
    console.log('\n' + '='.repeat(50));
    console.log('🎉 설정 완료! 다음 정보로 로그인하세요:');
    console.log('='.repeat(50));
    console.log(`이메일: ${email}`);
    console.log(`비밀번호: ${password}`);
    console.log(`역할: SUPER_ADMIN`);
    console.log('='.repeat(50));
    console.log('\n⚠️  보안을 위해 로그인 후 비밀번호를 변경하세요!');
    console.log('📱 로그인 URL: https://superplace-study.vercel.app/auth/signin\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 환경 변수 사용 예시:
// ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=YourSecurePassword123! node create-super-admin.js

createOrUpdateSuperAdmin()
  .then(() => {
    console.log('✅ 작업 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });
