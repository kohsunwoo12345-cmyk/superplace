// 학부모 관리 API
// GET, POST /api/admin/parents

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// 학부모 목록 조회
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

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // URL 파라미터
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');

    let parents;

    if (studentId) {
      // 특정 학생의 학부모 조회
      parents = await db
        .prepare(`
          SELECT 
            p.*,
            sp.isPrimary,
            sp.studentId
          FROM Parent p
          INNER JOIN StudentParent sp ON sp.parentId = p.id
          WHERE sp.studentId = ?
          ORDER BY sp.isPrimary DESC, p.name ASC
        `)
        .bind(studentId)
        .all();
    } else {
      // 전체 학부모 조회
      parents = await db
        .prepare('SELECT * FROM Parent ORDER BY createdAt DESC')
        .all();
    }

    return new Response(
      JSON.stringify({
        success: true,
        parents: parents.results || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('학부모 조회 오류:', error);
    return new Response(
      JSON.stringify({ error: '학부모 조회 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 학부모 등록
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

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { name, phone, email, relationship, address, notes, studentId, isPrimary } = body;

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: '이름과 전화번호는 필수입니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const parentId = `parent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 중복 전화번호 확인
    const existing = await db
      .prepare('SELECT id FROM Parent WHERE phone = ?')
      .bind(phone)
      .first();

    let finalParentId = parentId;

    if (existing) {
      // 이미 존재하는 학부모
      finalParentId = existing.id as string;
    } else {
      // 새 학부모 등록
      await db
        .prepare(
          `INSERT INTO Parent (id, name, phone, email, relationship, address, notes, createdById, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(parentId, name, phone, email || null, relationship || null, address || null, notes || null, userId, now, now)
        .run();
    }

    // 학생과 연결
    if (studentId) {
      const relationId = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 기존 관계 확인
      const existingRelation = await db
        .prepare('SELECT id FROM StudentParent WHERE studentId = ? AND parentId = ?')
        .bind(studentId, finalParentId)
        .first();

      if (!existingRelation) {
        // 주 연락처 설정 시 다른 학부모의 isPrimary를 0으로 변경
        if (isPrimary) {
          await db
            .prepare('UPDATE StudentParent SET isPrimary = 0 WHERE studentId = ?')
            .bind(studentId)
            .run();
        }

        await db
          .prepare(
            `INSERT INTO StudentParent (id, studentId, parentId, isPrimary, createdById, createdAt)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .bind(relationId, studentId, finalParentId, isPrimary ? 1 : 0, userId, now)
          .run();
      }

      // 학생의 parentPhone 업데이트 (주 연락처인 경우)
      if (isPrimary) {
        await db
          .prepare('UPDATE User SET parentPhone = ? WHERE id = ?')
          .bind(phone, studentId)
          .run();
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parent: {
          id: finalParentId,
          name,
          phone,
          email,
          relationship,
          address,
          notes,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('학부모 등록 오류:', error);
    return new Response(
      JSON.stringify({ error: '학부모 등록 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
