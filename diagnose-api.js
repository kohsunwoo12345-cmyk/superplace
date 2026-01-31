#!/usr/bin/env node
/**
 * API 엔드포인트 진단 스크립트
 * /api/admin/users의 500 에러 원인을 분석합니다.
 */

const { PrismaClient } = require('@prisma/client');

console.log('🔍 API 엔드포인트 진단 시작...\n');

// 환경 변수 체크
console.log('📋 환경 변수 체크:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ 설정됨' : '❌ 없음');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ 설정됨' : '❌ 없음');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ 없음');
console.log();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
  console.log('\n해결 방법:');
  console.log('1. Vercel 대시보드에서 DATABASE_URL 복사');
  console.log('2. .env 파일에 추가: DATABASE_URL="복사한값"');
  console.log('3. 다시 실행: node diagnose-api.js');
  process.exit(1);
}

async function diagnose() {
  const prisma = new PrismaClient();

  try {
    console.log('📊 데이터베이스 연결 테스트...');
    
    // 1. 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 2. 사용자 수 확인
    console.log('👥 사용자 데이터 확인:');
    const totalUsers = await prisma.user.count();
    console.log(`전체 사용자: ${totalUsers}명`);

    if (totalUsers === 0) {
      console.log('❌ 데이터베이스에 사용자가 없습니다.');
      console.log('\n해결 방법:');
      console.log('1. 회원가입 페이지에서 새 계정 생성');
      console.log('2. 또는 Vercel 데이터베이스에서 데이터 확인');
      await prisma.$disconnect();
      return;
    }

    // 3. 역할별 통계
    const directors = await prisma.user.count({ where: { role: 'DIRECTOR' } });
    const teachers = await prisma.user.count({ where: { role: 'TEACHER' } });
    const students = await prisma.user.count({ where: { role: 'STUDENT' } });
    const superAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });

    console.log(`SUPER_ADMIN: ${superAdmins}명`);
    console.log(`학원장(DIRECTOR): ${directors}명`);
    console.log(`선생님(TEACHER): ${teachers}명`);
    console.log(`학생(STUDENT): ${students}명`);
    console.log();

    // 4. 승인 상태 확인
    console.log('✅ 승인 상태:');
    const approved = await prisma.user.count({ where: { approved: true } });
    const pending = await prisma.user.count({ where: { approved: false } });
    console.log(`승인됨: ${approved}명`);
    console.log(`승인 대기: ${pending}명`);
    console.log();

    // 5. SUPER_ADMIN 확인
    if (superAdmins === 0) {
      console.log('⚠️  SUPER_ADMIN 계정이 없습니다!');
      console.log('\n해결 방법:');
      console.log('node run-fix.js 실행하여 SUPER_ADMIN 생성');
      console.log();
    } else {
      console.log('✅ SUPER_ADMIN 계정 있음\n');
      
      const adminUsers = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true, email: true, name: true, approved: true }
      });
      
      console.log('SUPER_ADMIN 계정 목록:');
      adminUsers.forEach(user => {
        console.log(`- ${user.email} (${user.name}) - ${user.approved ? '승인됨' : '승인 대기'}`);
      });
      console.log();
    }

    // 6. API 엔드포인트 시뮬레이션
    console.log('🔬 /api/admin/users 엔드포인트 시뮬레이션...');
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          points: true,
          aiChatEnabled: true,
          aiHomeworkEnabled: true,
          aiStudyEnabled: true,
          approved: true,
          academy: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`✅ API 쿼리 성공: ${users.length}명의 사용자 조회됨`);
      console.log();

      // 샘플 데이터 출력 (처음 3명만)
      if (users.length > 0) {
        console.log('📋 샘플 데이터 (처음 3명):');
        users.slice(0, 3).forEach((user, index) => {
          console.log(`\n${index + 1}. ${user.name} (${user.email})`);
          console.log(`   역할: ${user.role}`);
          console.log(`   승인: ${user.approved ? '✅' : '❌'}`);
          console.log(`   학원: ${user.academy?.name || '없음'}`);
          console.log(`   포인트: ${user.points}`);
        });
      }

    } catch (queryError) {
      console.error('❌ API 쿼리 실패:', queryError.message);
      console.log('\n가능한 원인:');
      console.log('1. Prisma 스키마와 데이터베이스 불일치');
      console.log('2. 데이터베이스 마이그레이션 필요');
      console.log('\n해결 방법:');
      console.log('npx prisma db push');
    }

    await prisma.$disconnect();

    console.log('\n✅ 진단 완료!');
    console.log('\n다음 단계:');
    if (superAdmins === 0) {
      console.log('1. node run-fix.js 실행하여 SUPER_ADMIN 생성');
    }
    if (pending > 0) {
      console.log(`2. ${pending}명의 승인 대기 사용자 승인 필요`);
    }
    console.log('3. Vercel에서 환경 변수 확인');
    console.log('4. https://superplace-study.vercel.app/dashboard/admin/users 재접속');

  } catch (error) {
    console.error('\n❌ 진단 실패:', error.message);
    console.log('\n상세 에러:');
    console.error(error);
    
    console.log('\n가능한 원인:');
    console.log('1. DATABASE_URL이 잘못되었거나 연결할 수 없음');
    console.log('2. 데이터베이스 서버가 다운되었거나 접근 불가');
    console.log('3. SSL/네트워크 설정 문제');
    
    console.log('\n해결 방법:');
    console.log('1. DATABASE_URL 재확인 (Vercel 대시보드)');
    console.log('2. 데이터베이스 서버 상태 확인');
    console.log('3. ?sslmode=require 파라미터 확인');
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

diagnose();
