// SMS 발송 이력 API
// GET /api/admin/sms/logs

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

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

    // URL 파라미터에서 필터 옵션 가져오기
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 발송 이력 조회
    const logs = await db
      .prepare(`
        SELECT * FROM SMSLog 
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
      `)
      .bind(limit, offset)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        logs: logs.results || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('발송 이력 조회 오류:', error);
    return new Response(
      JSON.stringify({ error: '발송 이력 조회 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
