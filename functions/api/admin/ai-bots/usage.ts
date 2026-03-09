interface Env {
  DB: D1Database;
}

// Simple token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

/**
 * GET /api/admin/ai-bots/usage?userId=xxx&botId=xxx
 * 사용자의 봇 일일 사용량 조회
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse token
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const botId = url.searchParams.get('botId');

    if (!userId || !botId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'userId and botId are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 사용량 조회 요청: userId=${userId}, botId=${botId}`);

    // 할당 정보 조회
    const assignment = await DB.prepare(`
      SELECT id, dailyUsageLimit, startDate, endDate, status
      FROM ai_bot_assignments
      WHERE userId = ? AND botId = ? AND status = 'active'
    `).bind(userId, botId).first() as any;

    if (!assignment) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active assignment found' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // 오늘 사용량 조회
    const usageToday = await DB.prepare(`
      SELECT COALESCE(SUM(messageCount), 0) as totalUsed
      FROM bot_usage_logs
      WHERE assignmentId = ? 
        AND userId = ?
        AND DATE(createdAt) = ?
    `).bind(assignment.id, userId, today).first() as any;

    const usedCount = usageToday?.totalUsed || 0;
    const dailyLimit = assignment.dailyUsageLimit || 15;
    const remaining = Math.max(0, dailyLimit - usedCount);

    // 최근 7일 사용량 통계
    const weeklyStats = await DB.prepare(`
      SELECT 
        DATE(createdAt) as date,
        SUM(messageCount) as count
      FROM bot_usage_logs
      WHERE assignmentId = ?
        AND userId = ?
        AND DATE(createdAt) >= DATE('now', '-7 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `).bind(assignment.id, userId).all();

    console.log(`✅ 사용량 조회 완료: ${usedCount}/${dailyLimit}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId,
          botId,
          assignmentId: assignment.id,
          dailyUsageLimit: dailyLimit,
          usedToday: usedCount,
          remainingToday: remaining,
          isLimitExceeded: usedCount >= dailyLimit,
          assignmentStatus: assignment.status,
          assignmentPeriod: {
            startDate: assignment.startDate,
            endDate: assignment.endDate
          },
          weeklyStats: weeklyStats.results
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ 사용량 조회 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
