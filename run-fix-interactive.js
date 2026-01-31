#!/usr/bin/env node
/**
 * 대화형 수정 스크립트 - DATABASE_URL 입력 후 자동 수정
 */

const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 SUPER_ADMIN 자동 생성 도구\n');
console.log('=' .repeat(60));
console.log('\n이 스크립트는 다음 작업을 수행합니다:');
console.log('1. 데이터베이스 연결 테스트');
console.log('2. 첫 번째 사용자를 SUPER_ADMIN으로 업그레이드');
console.log('3. 모든 사용자 자동 승인');
console.log('\n' + '='.repeat(60) + '\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    // DATABASE_URL 입력
    let databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('📋 DATABASE_URL을 입력해주세요.');
      console.log('   (Vercel 대시보드 → Settings → Environment Variables)\n');
      databaseUrl = await question('DATABASE_URL: ');
      
      if (!databaseUrl) {
        console.error('\n❌ DATABASE_URL이 비어있습니다.');
        process.exit(1);
      }
    }

    console.log('\n✅ DATABASE_URL 설정 완료');
    console.log(`   ${databaseUrl.substring(0, 30)}...\n`);

    // Prisma 클라이언트 생성
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });

    // 연결 테스트
    console.log('🔌 데이터베이스 연결 테스트...');
    await prisma.$connect();
    console.log('✅ 연결 성공!\n');

    // 사용자 수 확인
    const totalUsers = await prisma.user.count();
    console.log(`👥 전체 사용자: ${totalUsers}명`);

    if (totalUsers === 0) {
      console.log('\n❌ 데이터베이스에 사용자가 없습니다.');
      console.log('   먼저 회원가입을 진행해주세요.');
      await prisma.$disconnect();
      process.exit(1);
    }

    // SUPER_ADMIN 확인
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' }
    });

    console.log(`🔑 SUPER_ADMIN: ${superAdminCount}명\n`);

    if (superAdminCount > 0) {
      console.log('✅ 이미 SUPER_ADMIN 계정이 있습니다!');
      
      const admins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { email: true, name: true, approved: true }
      });

      console.log('\nSUPER_ADMIN 목록:');
      admins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.name}) - ${admin.approved ? '승인됨' : '승인 대기'}`);
      });

      const proceed = await question('\n다른 사용자도 SUPER_ADMIN으로 업그레이드하시겠습니까? (y/n): ');
      
      if (proceed.toLowerCase() !== 'y') {
        console.log('\n✅ 작업을 취소했습니다.');
        await prisma.$disconnect();
        process.exit(0);
      }
    }

    // 첫 번째 사용자 조회
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!firstUser) {
      console.log('\n❌ 사용자를 찾을 수 없습니다.');
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log('\n🔄 첫 번째 사용자를 SUPER_ADMIN으로 업그레이드합니다...');
    console.log(`📧 이메일: ${firstUser.email}`);
    console.log(`👤 이름: ${firstUser.name}`);
    console.log(`🏷️  현재 역할: ${firstUser.role}`);
    console.log(`✅ 승인 상태: ${firstUser.approved ? '승인됨' : '승인 대기'}\n`);

    const confirm = await question('계속하시겠습니까? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('\n✅ 작업을 취소했습니다.');
      await prisma.$disconnect();
      process.exit(0);
    }

    // 업데이트
    await prisma.user.update({
      where: { id: firstUser.id },
      data: {
        role: 'SUPER_ADMIN',
        approved: true
      }
    });

    console.log('\n✅ SUPER_ADMIN 생성 완료!');

    // 모든 사용자 승인
    const approveAll = await question('\n모든 사용자를 승인하시겠습니까? (y/n): ');
    
    if (approveAll.toLowerCase() === 'y') {
      const result = await prisma.user.updateMany({
        where: { approved: false },
        data: { approved: true }
      });

      console.log(`✅ ${result.count}명의 사용자를 승인했습니다!`);
    }

    // 최종 상태
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 상태:');
    const finalStats = {
      total: await prisma.user.count(),
      superAdmins: await prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      directors: await prisma.user.count({ where: { role: 'DIRECTOR' } }),
      teachers: await prisma.user.count({ where: { role: 'TEACHER' } }),
      students: await prisma.user.count({ where: { role: 'STUDENT' } }),
      approved: await prisma.user.count({ where: { approved: true } }),
      pending: await prisma.user.count({ where: { approved: false } })
    };

    console.log(`전체 사용자: ${finalStats.total}명`);
    console.log(`SUPER_ADMIN: ${finalStats.superAdmins}명`);
    console.log(`학원장: ${finalStats.directors}명`);
    console.log(`선생님: ${finalStats.teachers}명`);
    console.log(`학생: ${finalStats.students}명`);
    console.log(`승인됨: ${finalStats.approved}명`);
    console.log(`승인 대기: ${finalStats.pending}명`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ 모든 작업이 완료되었습니다!\n');
    console.log('다음 단계:');
    console.log('1. https://superplace-study.vercel.app/auth/signin');
    console.log(`2. ${firstUser.email} 으로 로그인`);
    console.log('3. /dashboard/admin/users 접속');
    console.log('4. 사용자 목록 확인\n');

    await prisma.$disconnect();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 에러 발생:', error.message);
    console.error('\n상세 에러:');
    console.error(error);
    
    console.log('\n해결 방법:');
    console.log('1. DATABASE_URL이 올바른지 확인');
    console.log('2. 데이터베이스 서버가 실행 중인지 확인');
    console.log('3. 네트워크 연결 확인');
    console.log('4. Vercel 대시보드에서 환경 변수 재확인');
    
    rl.close();
    process.exit(1);
  }
}

main();
