// SMS 통계 API
// GET /api/admin/sms/stats

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
    
    // JWT 검증 (간단히 토큰에서 사용자 ID 추출)
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

    // 사용자 권한 확인 (SUPER_ADMIN 또는 DIRECTOR)
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

    // 통계 조회
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 총 발송 건수
    const totalSentResult = await db
      .prepare('SELECT COUNT(*) as count FROM SMSLog WHERE status = ?')
      .bind('success')
      .first();
    const totalSent = totalSentResult?.count || 0;

    // 이번 달 발송 건수
    const thisMonthResult = await db
      .prepare('SELECT COUNT(*) as count FROM SMSLog WHERE status = ? AND sent_at >= ?')
      .bind('success', thisMonthStart)
      .first();
    const thisMonth = thisMonthResult?.count || 0;

    // 포인트 잔액
    const balanceResult = await db
      .prepare('SELECT balance FROM SMSBalance WHERE id = ?')
      .bind('default')
      .first();
    const balance = balanceResult?.balance || 0;

    // 템플릿 개수
    const templatesResult = await db
      .prepare('SELECT COUNT(*) as count FROM SMSTemplate')
      .first();
    const templates = templatesResult?.count || 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalSent,
          thisMonth,
          balance,
          templates,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('SMS 통계 조회 오류:', error);
    return new Response(
      JSON.stringify({ error: '통계 조회 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
