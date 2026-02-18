import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');

    let query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.academyId,
        c.teacherId,
        c.startDate,
        c.endDate,
        c.colorTag,
        c.isActive,
        c.createdAt,
        c.updatedAt,
        a.name as academyName,
        u.name as teacherName
      FROM classes c
      LEFT JOIN academy a ON c.academyId = a.id
      LEFT JOIN users u ON c.teacherId = u.id
      WHERE 1=1
    `;

    const bindings: any[] = [];

    if (academyId) {
      query += ' AND c.academyId = ?';
      bindings.push(academyId);
    }

    query += ' ORDER BY c.createdAt DESC';

    const stmt = bindings.length > 0 
      ? db.prepare(query).bind(...bindings)
      : db.prepare(query);
    
    const result = await stmt.all();

    console.log('📚 Found classes:', result.results?.length || 0);

    return NextResponse.json({
      success: true,
      classes: result.results || [],
      count: result.results?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch classes', 
        details: error instanceof Error ? error.message : 'Unknown error',
        classes: []
      },
      { status: 500 }
    );
  }
}
