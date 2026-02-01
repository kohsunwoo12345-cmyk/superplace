import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
      studentCode: true,
      approved: true,
      academyId: true,
      academy: {
        select: {
          name: true
        }
      }
    }
  });

  console.log('\n📚 학생 목록:\n');
  students.forEach(s => {
    console.log(`✅ ${s.name} (${s.email})`);
    console.log(`   학생코드: ${s.studentCode}`);
    console.log(`   승인상태: ${s.approved ? '승인됨' : '대기중'}`);
    console.log(`   학원: ${s.academy?.name || '없음'}`);
    console.log('');
  });
}

main().finally(() => prisma.$disconnect());
