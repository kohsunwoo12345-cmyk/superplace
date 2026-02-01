import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 접속 로그 시드 데이터 생성 시작...');

  // 기존 사용자 조회
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, name: true, email: true },
  });

  if (users.length === 0) {
    console.log('⚠️  등록된 사용자가 없습니다. 먼저 사용자를 생성해주세요.');
    return;
  }

  console.log(`✅ ${users.length}명의 사용자를 찾았습니다.`);

  // 접속 로그 생성
  const accessLogs = [];
  const activityTypes = ['page_view', 'login', 'logout', 'student_view', 'ai_chat'];
  const paths = [
    '/dashboard',
    '/dashboard/students',
    '/dashboard/ai-bots-list',
    '/dashboard/classes',
    '/dashboard/analytics',
  ];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const oses = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'];
  const devices = ['desktop', 'mobile', 'tablet'];

  // 회원 로그 생성 (50개)
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);

    const accessedAt = new Date();
    accessedAt.setDate(accessedAt.getDate() - randomDaysAgo);
    accessedAt.setHours(randomHours, randomMinutes, 0, 0);

    accessLogs.push({
      userId: user.id,
      sessionId: `sess_${user.id}_${Date.now()}_${i}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`,
      userAgent: `Mozilla/5.0 (${oses[Math.floor(Math.random() * oses.length)]})`,
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: oses[Math.floor(Math.random() * oses.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      path: paths[Math.floor(Math.random() * paths.length)],
      method: 'GET',
      activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
      accessedAt,
      duration: Math.floor(Math.random() * 5000) + 1000,
    });
  }

  // 비회원 로그 생성 (20개)
  for (let i = 0; i < 20; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);

    const accessedAt = new Date();
    accessedAt.setDate(accessedAt.getDate() - randomDaysAgo);
    accessedAt.setHours(randomHours, randomMinutes, 0, 0);

    accessLogs.push({
      userId: null,
      sessionId: `guest_${Date.now()}_${i}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`,
      userAgent: `Mozilla/5.0 (${oses[Math.floor(Math.random() * oses.length)]})`,
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: oses[Math.floor(Math.random() * oses.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      path: '/',
      method: 'GET',
      activityType: 'page_view',
      accessedAt,
      duration: Math.floor(Math.random() * 3000) + 500,
    });
  }

  // 데이터베이스에 저장
  console.log(`💾 ${accessLogs.length}개의 접속 로그 생성 중...`);

  for (const log of accessLogs) {
    await prisma.accessLog.create({ data: log });
  }

  console.log('✅ 접속 로그 생성 완료!');

  // 활동 로그 생성 (30개)
  console.log('💾 활동 로그 생성 중...');

  const actions = [
    'LOGIN',
    'LOGOUT',
    'PAGE_VIEW',
    'STUDENT_ADD',
    'STUDENT_EDIT',
    'AI_CHAT',
    'ASSIGNMENT_CREATE',
  ];
  const resources = ['students', 'assignments', 'ai-bots', 'pages'];
  const descriptions = [
    '학생 정보를 조회했습니다.',
    '새로운 과제를 생성했습니다.',
    'AI 봇과 대화를 시작했습니다.',
    '로그인했습니다.',
    '로그아웃했습니다.',
    '페이지를 조회했습니다.',
  ];

  const activityLogs = [];

  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randomDaysAgo);
    createdAt.setHours(randomHours, randomMinutes, 0, 0);

    activityLogs.push({
      userId: user.id,
      sessionId: `sess_${user.id}_${Date.now()}_${i}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      resource: resources[Math.floor(Math.random() * resources.length)],
      resourceId: `res_${Math.random().toString(36).substring(7)}`,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`,
      userAgent: `Mozilla/5.0 (${oses[Math.floor(Math.random() * oses.length)]})`,
      createdAt,
      metadata: {
        test: true,
        timestamp: createdAt.toISOString(),
      },
    });
  }

  for (const log of activityLogs) {
    await prisma.activityLog.create({ data: log });
  }

  console.log('✅ 활동 로그 생성 완료!');
  console.log('🎉 모든 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
