// SMS 템플릿 개별 API
// PUT, DELETE /api/admin/sms/templates/[id]

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// 템플릿 수정
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const templateId = params.id;

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

    // 템플릿 수정
    const now = new Date().toISOString();
    await db
      .prepare(
        `UPDATE SMSTemplate 
         SET title = ?, content = ?, folder_id = ?, updatedAt = ?
         WHERE id = ?`
      )
      .bind(title, content, folder_id || null, now, templateId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        template: {
          id: templateId,
          title,
          content,
          folder_id,
          updatedAt: now,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('템플릿 수정 오류:', error);
    return new Response(
      JSON.stringify({ error: '템플릿 수정 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 템플릿 삭제
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const templateId = params.id;

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

    // 템플릿 삭제
    await db
      .prepare('DELETE FROM SMSTemplate WHERE id = ?')
      .bind(templateId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '템플릿이 삭제되었습니다',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('템플릿 삭제 오류:', error);
    return new Response(
      JSON.stringify({ error: '템플릿 삭제 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
