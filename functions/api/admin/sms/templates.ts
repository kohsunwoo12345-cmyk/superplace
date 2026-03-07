// SMS 템플릿 API
// GET, POST /api/admin/sms/templates

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// 템플릿 목록 조회
export async function GET(request: Request) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    let userId: string;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.userId || decoded.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 사용자 권한 확인
    const user = await db
      .prepare('SELECT role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 템플릿 목록 조회
    const templates = await db
      .prepare('SELECT * FROM SMSTemplate ORDER BY createdAt DESC')
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        templates: templates.results || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('템플릿 조회 오류:', error);
    return new Response(
      JSON.stringify({ error: '템플릿 조회 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 템플릿 생성
export async function POST(request: Request) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    let userId: string;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.userId || decoded.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 사용자 권한 확인
    const user = await db
      .prepare('SELECT role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { title, content, folder_id } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: '제목과 내용은 필수입니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 템플릿 생성
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO SMSTemplate (id, title, content, folder_id, createdById, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(templateId, title, content, folder_id || null, userId, now, now)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        template: {
          id: templateId,
          title,
          content,
          folder_id,
          createdById: userId,
          createdAt: now,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('템플릿 생성 오류:', error);
    return new Response(
      JSON.stringify({ error: '템플릿 생성 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
