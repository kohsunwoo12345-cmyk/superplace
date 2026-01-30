/**
 * 로컬 DB 사용자를 D1 INSERT SQL로 변환
 * 
 * 이 스크립트는 Cloudflare D1 Console에서 실행할 수 있는 SQL을 생성합니다.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function generateD1SQL() {
  console.log('🔍 로컬 사용자 조회 중...');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      phone: true,
      role: true,
      grade: true,
      studentCode: true,
      studentId: true,
      parentPhone: true,
      academyId: true,
      points: true,
      aiChatEnabled: true,
      aiHomeworkEnabled: true,
      aiStudyEnabled: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 100, // 최대 100명
  });

  console.log(`📊 ${users.length}명의 사용자를 찾았습니다.\n`);

  let sql = '-- D1 사용자 INSERT SQL\n';
  sql += '-- Cloudflare D1 Console에서 실행하세요\n\n';

  users.forEach((user, index) => {
    const values = [
      `'${user.id}'`,
      `'${user.email.replace(/'/g, "''")}'`, // SQL escape
      `'${user.name.replace(/'/g, "''")}'`,
      `'${user.password}'`,
      user.phone ? `'${user.phone}'` : 'NULL',
      `'${user.role}'`,
      user.grade ? `'${user.grade}'` : 'NULL',
      user.studentCode ? `'${user.studentCode}'` : 'NULL',
      user.studentId ? `'${user.studentId}'` : 'NULL',
      user.parentPhone ? `'${user.parentPhone}'` : 'NULL',
      user.academyId ? `'${user.academyId}'` : 'NULL',
      user.points || 0,
      user.aiChatEnabled ? 1 : 0,
      user.aiHomeworkEnabled ? 1 : 0,
      user.aiStudyEnabled ? 1 : 0,
      user.approved ? 1 : 0,
      `'${user.createdAt.toISOString()}'`,
      `'${user.updatedAt.toISOString()}'`,
    ];

    sql += `INSERT OR REPLACE INTO User (
  id, email, name, password, phone, role, grade,
  studentCode, studentId, parentPhone, academyId,
  points, aiChatEnabled, aiHomeworkEnabled, aiStudyEnabled,
  approved, createdAt, updatedAt
) VALUES (${values.join(', ')});\n\n`;
  });

  sql += `-- 완료: ${users.length}명의 사용자\n`;

  // 파일로 저장
  const filename = 'd1-import.sql';
  fs.writeFileSync(filename, sql);
  
  console.log(`✅ SQL 생성 완료!`);
  console.log(`📄 파일: ${filename}`);
  console.log(`\n📋 사용 방법:`);
  console.log(`1. Cloudflare Dashboard → D1 → [Database] → Console`);
  console.log(`2. ${filename} 파일의 내용을 복사`);
  console.log(`3. D1 Console에 붙여넣고 Execute\n`);
  
  // 샘플 출력
  console.log('--- 샘플 SQL (처음 3명) ---');
  const sampleSQL = sql.split('\n').slice(0, 30).join('\n');
  console.log(sampleSQL);
  console.log('...\n');

  await prisma.$disconnect();
}

generateD1SQL().catch(console.error);
