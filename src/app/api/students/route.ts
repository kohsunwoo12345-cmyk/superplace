import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');
    const role = searchParams.get('role');

    let query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.academyId,
        u.studentCode,
        u.className,
        u.createdAt,
        a.name as academy_name
      FROM users u
      LEFT JOIN academy a ON u.academyId = a.id
      WHERE u.role = 'STUDENT'
    `;

    const bindings: any[] = [];

    // 학원장은 자신의 학원 학생만 조회
    if (academyId && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      query += ' AND u.academyId = ?';
      bindings.push(academyId);
    }

    query += ' ORDER BY u.createdAt DESC';

    const stmt = bindings.length > 0 
      ? db.prepare(query).bind(...bindings)
      : db.prepare(query);
    
    const result = await stmt.all();

    console.log('👨‍🎓 Found students:', result.results?.length || 0);

    return NextResponse.json({
      success: true,
      students: result.results || [],
      count: result.results?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch students', 
        details: error instanceof Error ? error.message : 'Unknown error',
        students: []
      },
      { status: 500 }
    );
  }
}
