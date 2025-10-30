const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('사용법: node make-admin.js <email>');
    console.log('예시: node make-admin.js test@example.com');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`사용자를 찾을 수 없습니다: ${email}`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'SUPERADMIN' },
  });

  console.log(`✅ ${email} 사용자가 SUPERADMIN으로 승격되었습니다!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
