// 학부모 개별 API
// PUT, DELETE /api/admin/parents/[id]

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// 학부모 수정
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const parentId = params.id;

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

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { name, phone, email, relationship, address, notes } = body;

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: '이름과 전화번호는 필수입니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 학부모 수정
    const now = new Date().toISOString();
    await db
      .prepare(
        `UPDATE Parent 
         SET name = ?, phone = ?, email = ?, relationship = ?, address = ?, notes = ?, updatedAt = ?
         WHERE id = ?`
      )
      .bind(name, phone, email || null, relationship || null, address || null, notes || null, now, parentId)
      .run();

    // 연결된 학생의 parentPhone도 업데이트 (isPrimary인 경우)
    await db
      .prepare(`
        UPDATE User
        SET parentPhone = ?
        WHERE id IN (
          SELECT studentId FROM StudentParent 
          WHERE parentId = ? AND isPrimary = 1
        )
      `)
      .bind(phone, parentId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        parent: {
          id: parentId,
          name,
          phone,
          email,
          relationship,
          address,
          notes,
          updatedAt: now,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('학부모 수정 오류:', error);
    return new Response(
      JSON.stringify({ error: '학부모 수정 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 학부모 삭제
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const parentId = params.id;

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

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 학부모 삭제 (CASCADE로 StudentParent도 자동 삭제됨)
    await db
      .prepare('DELETE FROM Parent WHERE id = ?')
      .bind(parentId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '학부모가 삭제되었습니다',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('학부모 삭제 오류:', error);
    return new Response(
      JSON.stringify({ error: '학부모 삭제 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
