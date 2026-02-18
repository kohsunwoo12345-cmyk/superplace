import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const academyId = searchParams.get('academyId');

    if (!teacherId || !academyId) {
      return NextResponse.json(
        { error: 'teacherId and academyId are required' },
        { status: 400 }
      );
    }

    // teacher_permissions 테이블이 없을 수 있으므로 try-catch
    try {
      const result = await db.prepare(`
        SELECT * FROM teacher_permissions
        WHERE teacherId = ? AND academyId = ?
      `).bind(teacherId, academyId).all();

      return NextResponse.json({
        success: true,
        permissions: result.results || []
      });
    } catch (error) {
      // 테이블이 없으면 빈 배열 반환
      console.warn('teacher_permissions table may not exist');
      return NextResponse.json({
        success: true,
        permissions: []
      });
    }
  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions', permissions: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const body = await request.json();
    const {
      teacherId,
      academyId,
      canViewAllClasses,
      canViewAllStudents,
      canManageHomework,
      canManageAttendance,
      canViewStatistics
    } = body;

    if (!teacherId || !academyId) {
      return NextResponse.json(
        { error: 'teacherId and academyId are required' },
        { status: 400 }
      );
    }

    // teacher_permissions 테이블 생성 (없으면)
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS teacher_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teacherId TEXT NOT NULL,
          academyId TEXT NOT NULL,
          canViewAllClasses INTEGER DEFAULT 0,
          canViewAllStudents INTEGER DEFAULT 0,
          canManageHomework INTEGER DEFAULT 1,
          canManageAttendance INTEGER DEFAULT 1,
          canViewStatistics INTEGER DEFAULT 0,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now')),
          UNIQUE(teacherId, academyId)
        )
      `).run();
    } catch (e) {
      console.log('Table may already exist');
    }

    // INSERT OR REPLACE
    await db.prepare(`
      INSERT OR REPLACE INTO teacher_permissions 
        (teacherId, academyId, canViewAllClasses, canViewAllStudents, canManageHomework, canManageAttendance, canViewStatistics, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      teacherId,
      academyId,
      canViewAllClasses ? 1 : 0,
      canViewAllStudents ? 1 : 0,
      canManageHomework ? 1 : 0,
      canManageAttendance ? 1 : 0,
      canViewStatistics ? 1 : 0
    ).run();

    return NextResponse.json({
      success: true,
      message: '권한이 저장되었습니다'
    });
  } catch (error) {
    console.error('❌ Error saving permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save permissions' },
      { status: 500 }
    );
  }
}
