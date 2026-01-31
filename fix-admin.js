#!/usr/bin/env node

/**
 * 프로덕션 데이터베이스 자동 수정 스크립트
 * 
 * 이 스크립트는:
 * 1. 첫 번째 사용자를 찾아 SUPER_ADMIN으로 설정
 * 2. 모든 사용자를 승인 (approved: true)
 * 3. SUPER_ADMIN이 없으면 새로 생성
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// DATABASE_URL을 환경 변수 또는 인자로 받음
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL이 필요합니다.');
  console.log('\n사용법:');
  console.log('  DATABASE_URL="postgres://..." node fix-admin.js');
  console.log('  또는');
  console.log('  node fix-admin.js "postgres://..."');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function fixAdmin() {
  console.log('🔧 데이터베이스 수정 시작...\n');
  console.log('📍 연결 중...');

  try {
    // 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 1. 모든 사용자 조회
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 전체 사용자: ${users.length}명\n`);

    if (users.length === 0) {
      // 사용자가 없으면 SUPER_ADMIN 생성
      console.log('⚠️  사용자가 없습니다. SUPER_ADMIN 계정 생성 중...\n');
      
      const email = 'admin@superplace.com';
      const password = 'Admin1234!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: '시스템 관리자',
          role: 'SUPER_ADMIN',
          approved: true,
        },
      });

      console.log('✅ SUPER_ADMIN 계정 생성 완료!\n');
      console.log('='.repeat(50));
      console.log('📧 이메일:', email);
      console.log('🔑 비밀번호:', password);
      console.log('='.repeat(50));
      console.log('\n⚠️  로그인 후 비밀번호를 변경하세요!');
      
    } else {
      // 2. SUPER_ADMIN 확인
      const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
      
      if (superAdmins.length === 0) {
        // 첫 번째 사용자를 SUPER_ADMIN으로 설정
        console.log('⚠️  SUPER_ADMIN이 없습니다.\n');
        console.log(`📝 첫 번째 사용자를 SUPER_ADMIN으로 설정합니다:`);
        console.log(`   ${users[0].name} (${users[0].email})\n`);

        const updated = await prisma.user.update({
          where: { id: users[0].id },
          data: {
            role: 'SUPER_ADMIN',
            approved: true,
          },
        });

        console.log('✅ SUPER_ADMIN 설정 완료!\n');
        console.log('='.repeat(50));
        console.log('📧 이메일:', updated.email);
        console.log('👤 이름:', updated.name);
        console.log('🔐 역할: SUPER_ADMIN');
        console.log('='.repeat(50));
      } else {
        console.log(`✅ SUPER_ADMIN 계정: ${superAdmins.length}명`);
        superAdmins.forEach(admin => {
          console.log(`   - ${admin.name} (${admin.email})`);
        });
        console.log();
      }

      // 3. 승인되지 않은 사용자 확인
      const pending = users.filter(u => !u.approved);
      
      if (pending.length > 0) {
        console.log(`⚠️  승인 대기 중인 사용자: ${pending.length}명`);
        pending.forEach(user => {
          console.log(`   - ${user.name} (${user.email})`);
        });
        
        console.log('\n🔄 모든 사용자 승인 중...');
        
        const result = await prisma.user.updateMany({
          where: { approved: false },
          data: { approved: true },
        });

        console.log(`✅ ${result.count}명 승인 완료!\n`);
      } else {
        console.log('✅ 모든 사용자가 승인되었습니다.\n');
      }

      // 4. 최종 상태 출력
      const finalUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          role: true,
          approved: true,
        },
        orderBy: {
          role: 'asc',
        },
      });

      console.log('📋 최종 사용자 목록:');
      console.log('='.repeat(70));
      finalUsers.forEach(user => {
        const status = user.approved ? '✅' : '⏳';
        console.log(`${status} ${user.name.padEnd(20)} ${user.email.padEnd(30)} ${user.role}`);
      });
      console.log('='.repeat(70));
    }

    console.log('\n✨ 모든 작업 완료!\n');
    console.log('🌐 로그인 페이지: https://superplace-study.vercel.app/auth/signin');
    console.log('👥 사용자 관리: https://superplace-study.vercel.app/dashboard/admin/users\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    
    if (error.code === 'P1001') {
      console.error('\n💡 데이터베이스 연결 실패. DATABASE_URL을 확인하세요.');
    } else if (error.code === 'P1017') {
      console.error('\n💡 데이터베이스 서버가 닫혀있습니다.');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
