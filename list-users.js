const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAndApproveUsers() {
  console.log('👥 사용자 목록 조회 및 승인 도구\n');
  console.log('='.repeat(70));

  try {
    // 1. 전체 사용자 조회
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        academyId: true,
        academy: {
          select: {
            name: true,
            code: true,
          }
        },
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    if (users.length === 0) {
      console.log('⚠️  데이터베이스에 사용자가 없습니다.');
      console.log('\n해결 방법:');
      console.log('  1. https://superplace-study.vercel.app/auth/signup 에서 회원가입');
      console.log('  2. node create-super-admin.js 실행하여 관리자 계정 생성');
      return;
    }

    console.log(`\n📊 전체 사용자: ${users.length}명\n`);

    // 2. 사용자 목록 출력
    users.forEach((user, index) => {
      const approvalStatus = user.approved ? '✅ 승인됨' : '⏳ 대기중';
      const academy = user.academy ? `${user.academy.name} (${user.academy.code})` : '없음';
      const lastLogin = user.lastLoginAt 
        ? new Date(user.lastLoginAt).toLocaleString('ko-KR')
        : '로그인 기록 없음';

      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   역할: ${user.role}`);
      console.log(`   승인: ${approvalStatus}`);
      console.log(`   학원: ${academy}`);
      console.log(`   가입: ${new Date(user.createdAt).toLocaleString('ko-KR')}`);
      console.log(`   마지막 로그인: ${lastLogin}`);
      console.log();
    });

    // 3. 통계
    const stats = {
      total: users.length,
      approved: users.filter(u => u.approved).length,
      pending: users.filter(u => !u.approved).length,
      superAdmin: users.filter(u => u.role === 'SUPER_ADMIN').length,
      director: users.filter(u => u.role === 'DIRECTOR').length,
      teacher: users.filter(u => u.role === 'TEACHER').length,
      student: users.filter(u => u.role === 'STUDENT').length,
    };

    console.log('='.repeat(70));
    console.log('📈 통계');
    console.log('='.repeat(70));
    console.log(`전체 사용자:    ${stats.total}명`);
    console.log(`승인됨:         ${stats.approved}명`);
    console.log(`승인 대기:      ${stats.pending}명`);
    console.log();
    console.log('역할별:');
    console.log(`  - SUPER_ADMIN: ${stats.superAdmin}명`);
    console.log(`  - DIRECTOR:    ${stats.director}명`);
    console.log(`  - TEACHER:     ${stats.teacher}명`);
    console.log(`  - STUDENT:     ${stats.student}명`);
    console.log('='.repeat(70));

    // 4. 승인 대기 중인 사용자 확인
    const pendingUsers = users.filter(u => !u.approved);
    
    if (pendingUsers.length > 0) {
      console.log(`\n⚠️  승인 대기 중인 사용자: ${pendingUsers.length}명`);
      
      // 모든 대기 사용자 자동 승인 (선택 사항)
      if (process.env.AUTO_APPROVE === 'true') {
        console.log('\n🔄 모든 대기 사용자 자동 승인 중...');
        
        const result = await prisma.user.updateMany({
          where: { approved: false },
          data: { approved: true },
        });
        
        console.log(`✅ ${result.count}명 승인 완료!`);
      } else {
        console.log('\n💡 모든 사용자를 자동 승인하려면:');
        console.log('   AUTO_APPROVE=true node list-users.js');
      }
    }

    // 5. SUPER_ADMIN 확인
    if (stats.superAdmin === 0) {
      console.log('\n⚠️  SUPER_ADMIN 계정이 없습니다!');
      console.log('💡 SUPER_ADMIN 계정 생성:');
      console.log('   node create-super-admin.js');
    } else {
      console.log(`\n✅ SUPER_ADMIN 계정: ${stats.superAdmin}명`);
      
      const admins = users.filter(u => u.role === 'SUPER_ADMIN');
      admins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
      });
    }

    console.log('\n✨ 조회 완료!\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 사용법:
// node list-users.js                    # 조회만
// AUTO_APPROVE=true node list-users.js  # 조회 + 자동 승인

listAndApproveUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 실행 실패:', error);
    process.exit(1);
  });
