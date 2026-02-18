import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    // 모든 학원 조회 (학생 및 선생님 수 포함)
    const academies = await db.prepare(`
      SELECT 
        a.id,
        a.name,
        a.code,
        a.address,
        a.phone,
        a.email,
        a.subscriptionPlan,
        a.isActive,
        a.createdAt,
        a.updatedAt,
        (SELECT name FROM users WHERE id = (
          SELECT id FROM users WHERE role = 'DIRECTOR' AND academyId = a.id LIMIT 1
        )) as directorName,
        (SELECT COUNT(*) FROM users WHERE academyId = a.id AND role = 'STUDENT') as studentCount,
        (SELECT COUNT(*) FROM users WHERE academyId = a.id AND role = 'TEACHER') as teacherCount
      FROM academy a
      ORDER BY a.createdAt DESC
    `).all();

    console.log('🏫 Found academies:', academies.results?.length || 0);

    return NextResponse.json({
      academies: academies.results || [],
      count: academies.results?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching academies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academies', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
