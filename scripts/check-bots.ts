import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 데이터베이스 봇 확인 중...\n');

  // 모든 봇 조회
  const allBots = await prisma.aIBot.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      folder: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  console.log('📊 총 봇 수:', allBots.length);
  console.log('');

  if (allBots.length === 0) {
    console.log('⚠️  데이터베이스에 봇이 없습니다!');
    console.log('');
    
    // SUPER_ADMIN 사용자 찾기
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
      },
    });

    if (superAdmin) {
      console.log('✅ SUPER_ADMIN 사용자 발견:', superAdmin.email);
      console.log('   ID:', superAdmin.id);
    } else {
      console.log('❌ SUPER_ADMIN 사용자가 없습니다!');
    }
  } else {
    console.log('봇 목록:');
    allBots.forEach((bot, index) => {
      console.log(`\n${index + 1}. ${bot.name} (${bot.botId})`);
      console.log(`   영문: ${bot.nameEn}`);
      console.log(`   아이콘: ${bot.icon}`);
      console.log(`   색상: ${bot.color}`);
      console.log(`   활성: ${bot.isActive ? '✅' : '❌'}`);
      console.log(`   생성자: ${bot.createdBy.name} (${bot.createdBy.email})`);
      console.log(`   폴더: ${bot.folder ? bot.folder.name : '없음'}`);
    });
  }

  // 폴더 확인
  console.log('\n\n📁 폴더 확인...\n');
  const folders = await prisma.botFolder.findMany({
    include: {
      _count: {
        select: {
          bots: true,
        },
      },
    },
  });

  console.log('총 폴더 수:', folders.length);
  if (folders.length > 0) {
    folders.forEach((folder, index) => {
      console.log(`\n${index + 1}. ${folder.name}`);
      console.log(`   설명: ${folder.description || '없음'}`);
      console.log(`   색상: ${folder.color}`);
      console.log(`   봇 수: ${folder._count.bots}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
