import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 테스트 로그 데이터 삭제 시작...');

  // 접속 로그 삭제
  const accessLogsDeleted = await prisma.accessLog.deleteMany({});
  console.log(`✅ ${accessLogsDeleted.count}개의 접속 로그 삭제 완료`);

  // 활동 로그 삭제
  const activityLogsDeleted = await prisma.activityLog.deleteMany({});
  console.log(`✅ ${activityLogsDeleted.count}개의 활동 로그 삭제 완료`);

  console.log('🎉 모든 테스트 로그 삭제 완료!');
  console.log('💡 이제부터 실제 사용자 활동만 기록됩니다.');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
