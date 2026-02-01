import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 API 로직 직접 테스트\n');

  // 1. 봇 조회 (API와 동일한 로직)
  const whereCondition: any = {};
  
  console.log('1️⃣ 봇 조회 시작...');
  console.log('   조건:', JSON.stringify(whereCondition, null, 2));

  try {
    const bots = await prisma.aIBot.findMany({
      where: whereCondition,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log('✅ 봇 조회 성공:', bots.length, '개\n');

    if (bots.length > 0) {
      console.log('첫 번째 봇:');
      console.log('   이름:', bots[0].name);
      console.log('   botId:', bots[0].botId);
      console.log('   생성자:', bots[0].createdBy);
      console.log('   폴더:', bots[0].folder);
      console.log('');
    }

    // 2. 할당 정보 조회
    console.log('2️⃣ 할당 정보 조회 시작...');
    const botsWithAssignments = await Promise.all(
      bots.map(async (bot) => {
        try {
          console.log(`   봇 "${bot.name}" (${bot.botId})의 할당 조회 중...`);
          
          const assignments = await prisma.botAssignment.findMany({
            where: {
              botId: bot.botId,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  academy: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              },
              grantedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          console.log(`   ✅ 할당 ${assignments.length}개 발견`);

          return {
            ...bot,
            assignments,
            _count: {
              assignments: assignments.length,
            },
          };
        } catch (assignmentError) {
          console.error(`   ❌ 할당 조회 오류:`, assignmentError);
          return {
            ...bot,
            assignments: [],
            _count: {
              assignments: 0,
            },
          };
        }
      })
    );

    console.log('\n✅ 할당 정보 포함 봇 수:', botsWithAssignments.length);

    // 3. 통계 계산
    const totalBots = botsWithAssignments.length;
    const activeBots = botsWithAssignments.filter((b) => b.isActive).length;
    const inactiveBots = totalBots - activeBots;
    const totalAssignments = botsWithAssignments.reduce(
      (sum, b) => sum + b._count.assignments,
      0
    );

    console.log('\n📊 통계:');
    console.log('   총 봇:', totalBots);
    console.log('   활성 봇:', activeBots);
    console.log('   비활성 봇:', inactiveBots);
    console.log('   총 할당:', totalAssignments);

    console.log('\n✅ 모든 테스트 성공!');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error('메시지:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\n스택 트레이스:');
      console.error(error.stack);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ 스크립트 실행 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
