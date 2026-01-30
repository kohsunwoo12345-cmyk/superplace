import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/generate-d1-sql
 * 
 * 로컬 DB 사용자를 D1 INSERT SQL로 변환
 * Cloudflare D1 Console에서 실행할 수 있는 SQL 생성
 */
export async function GET() {
  try {
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
      take: 100,
    });

    console.log(`📊 ${users.length}명의 사용자를 찾았습니다.`);

    let sql = '-- D1 사용자 INSERT SQL\n';
    sql += `-- 생성일: ${new Date().toISOString()}\n`;
    sql += `-- 사용자 수: ${users.length}명\n`;
    sql += '-- Cloudflare D1 Console에서 실행하세요\n\n';

    users.forEach((user) => {
      const escape = (str: string | null) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
      
      const values = [
        escape(user.id),
        escape(user.email),
        escape(user.name),
        escape(user.password),
        escape(user.phone),
        escape(user.role),
        escape(user.grade),
        escape(user.studentCode),
        escape(user.studentId),
        escape(user.parentPhone),
        escape(user.academyId),
        user.points || 0,
        user.aiChatEnabled ? 1 : 0,
        user.aiHomeworkEnabled ? 1 : 0,
        user.aiStudyEnabled ? 1 : 0,
        user.approved ? 1 : 0,
        escape(user.createdAt.toISOString()),
        escape(user.updatedAt.toISOString()),
      ];

      sql += `INSERT OR REPLACE INTO User (id, email, name, password, phone, role, grade, studentCode, studentId, parentPhone, academyId, points, aiChatEnabled, aiHomeworkEnabled, aiStudyEnabled, approved, createdAt, updatedAt) VALUES (${values.join(', ')});\n`;
    });

    sql += `\n-- 완료: ${users.length}명의 사용자\n`;

    return new NextResponse(sql, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="d1-import.sql"',
      },
    });
  } catch (error: any) {
    console.error('❌ SQL 생성 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
