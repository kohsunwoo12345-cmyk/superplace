// 사용자별 포인트 트랜잭션 조회 API
// GET /api/user/point-transactions

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    // 토큰 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const [userIdStr, email, role] = token.split('|');
    const userId = userIdStr;

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 포인트 트랜잭션 조회:', { userId, email });

    // 포인트 트랜잭션 조회 (이메일 기준으로도 조회)
    const result = await env.DB.prepare(`
      SELECT * FROM point_transactions 
      WHERE userId = ? OR userEmail = ?
      ORDER BY createdAt DESC 
      LIMIT 100
    `).bind(userId, email).all();

    console.log('✅ 트랜잭션 조회 완료:', result.results?.length || 0, '건');

    // 총 포인트 계산
    const totalPoints = (result.results || []).reduce((sum: number, row: any) => {
      return sum + (row.amount || 0);
    }, 0);

    return new Response(JSON.stringify({
      success: true,
      transactions: result.results || [],
      totalPoints,
      count: result.results?.length || 0,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ 포인트 트랜잭션 조회 실패:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch transactions',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
