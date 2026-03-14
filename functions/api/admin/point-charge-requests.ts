import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

// Token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

// GET: 포인트 충전 요청 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ADMIN 또는 SUPER_ADMIN만 조회 가능
    if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can view requests' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // URL 파라미터에서 필터 가져오기
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // PENDING, APPROVED, REJECTED

    console.log('📋 Fetching point charge requests, status filter:', status);

    // 포인트 충전 요청 목록 조회 (사용자 정보 JOIN)
    let query = `
      SELECT 
        pcr.*,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone,
        u.academyId as userAcademyId,
        a.name as academyName
      FROM PointChargeRequest pcr
      LEFT JOIN users u ON pcr.userId = u.id
      LEFT JOIN Academy a ON u.academyId = a.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ' AND pcr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY pcr.createdAt DESC';

    let stmt = env.DB.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }

    const { results: requests } = await stmt.all();

    console.log('✅ Found', requests.length, 'point charge requests');

    // 통계 계산
    const stats = {
      total: requests.length,
      pending: requests.filter((r: any) => r.status === 'PENDING').length,
      approved: requests.filter((r: any) => r.status === 'APPROVED').length,
      rejected: requests.filter((r: any) => r.status === 'REJECTED').length,
      totalAmount: requests
        .filter((r: any) => r.status === 'APPROVED')
        .reduce((sum: number, r: any) => sum + (r.totalPrice || 0), 0),
      totalPoints: requests
        .filter((r: any) => r.status === 'APPROVED')
        .reduce((sum: number, r: any) => sum + (r.requestedPoints || 0), 0)
    };

    return new Response(JSON.stringify({
      success: true,
      requests,
      stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch point charge requests:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch requests',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
