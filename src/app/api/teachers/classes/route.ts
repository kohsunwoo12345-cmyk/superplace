import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId is required' },
        { status: 400 }
      );
    }

    // teacher_classes 테이블이 없을 수 있으므로 try-catch
    try {
      const result = await db.prepare(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.academyId,
          c.colorTag,
          c.isActive
        FROM teacher_classes tc
        JOIN classes c ON tc.classId = c.id
        WHERE tc.teacherId = ?
      `).bind(teacherId).all();

      return NextResponse.json({
        success: true,
        classes: result.results || []
      });
    } catch (error) {
      // 테이블이 없으면 빈 배열 반환
      console.warn('teacher_classes table may not exist');
      return NextResponse.json({
        success: true,
        classes: []
      });
    }
  } catch (error) {
    console.error('❌ Error fetching teacher classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes', classes: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const body = await request.json();
    const { teacherId, classIds } = body;

    if (!teacherId || !Array.isArray(classIds)) {
      return NextResponse.json(
        { error: 'teacherId and classIds array are required' },
        { status: 400 }
      );
    }

    // teacher_classes 테이블 생성 (없으면)
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS teacher_classes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teacherId TEXT NOT NULL,
          classId TEXT NOT NULL,
          createdAt TEXT DEFAULT (datetime('now')),
          UNIQUE(teacherId, classId)
        )
      `).run();
    } catch (e) {
      console.log('Table may already exist');
    }

    // 기존 배정 삭제
    await db.prepare(`
      DELETE FROM teacher_classes WHERE teacherId = ?
    `).bind(teacherId).run();

    // 새로운 배정 추가
    for (const classId of classIds) {
      await db.prepare(`
        INSERT INTO teacher_classes (teacherId, classId)
        VALUES (?, ?)
      `).bind(teacherId, classId).run();
    }

    return NextResponse.json({
      success: true,
      message: `${classIds.length}개 반이 배정되었습니다`
    });
  } catch (error) {
    console.error('❌ Error assigning classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign classes' },
      { status: 500 }
    );
  }
}
