import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    // 모든 사용자 조회 (academy 정보 포함)
    const users = await db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.academyId,
        u.createdAt,
        u.updatedAt,
        a.name as academyName,
        s.attendanceCode
      FROM users u
      LEFT JOIN academy a ON u.academyId = a.id
      LEFT JOIN students s ON u.id = s.userId
      ORDER BY u.createdAt DESC
    `).all();

    console.log('👥 Found users:', users.results?.length || 0);

    return NextResponse.json({
      users: users.results || [],
      count: users.results?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
