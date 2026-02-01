import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 학원 조회
  const academy = await prisma.academy.findFirst({
    select: { id: true, name: true }
  });
  
  if (!academy) {
    console.log('❌ 학원이 없습니다. 먼저 학원을 생성해주세요.');
    return;
  }
  
  console.log(`✅ 학원 발견: ${academy.name} (${academy.id})\n`);
  
  // 학원에 소속되지 않은 학생 찾기
  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      academyId: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      studentCode: true
    }
  });
  
  console.log(`🔍 학원 미소속 학생: ${students.length}명\n`);
  
  for (const student of students) {
    await prisma.user.update({
      where: { id: student.id },
      data: { academyId: academy.id }
    });
    console.log(`✅ ${student.name} (${student.studentCode}) → ${academy.name} 소속 처리`);
  }
  
  console.log('\n🎉 완료!');
}

main().finally(() => prisma.$disconnect());
