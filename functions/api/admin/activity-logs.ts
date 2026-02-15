interface Env {
  DB: D1Database;
}

// 관리자용 활동 로그 조회 (학원장 봇 할당 포함)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const logs: any[] = [];

    // 1. 학원장 봇 할당 로그
    try {
      const directorAssignments = await DB.prepare(`
        SELECT 
          dba.id,
          dba.created_at as timestamp,
          'success' as level,
          'AI 시스템' as category,
          u.email as user,
          'AI 봇 할당' as action,
          'N/A' as ip,
          ('봇 ID: ' || dba.bot_id || ', 사용자 ID: ' || dba.user_id || ', 역할: ' || dba.user_role) as details
        FROM director_bot_assignments dba
        LEFT JOIN users u ON dba.created_by = u.id
        ORDER BY dba.created_at DESC
        LIMIT 100
      `).all();

      if (directorAssignments.results) {
        logs.push(...directorAssignments.results.map((r: any) => ({
          id: `director-${r.id}`,
          timestamp: r.timestamp,
          level: r.level,
          category: r.category,
          user: r.user || 'system',
          action: r.action,
          ip: r.ip,
          details: r.details
        })));
      }
    } catch (e) {
      console.log("⚠️ director_bot_assignments 테이블 없음:", e);
    }

    // 2. 사용자 로그인 로그
    try {
      const loginLogs = await DB.prepare(`
        SELECT 
          id,
          loginAt as timestamp,
          CASE WHEN success = 1 THEN 'success' ELSE 'error' END as level,
          '인증' as category,
          (SELECT email FROM users WHERE id = userId) as user,
          CASE WHEN success = 1 THEN '로그인 성공' ELSE '로그인 실패' END as action,
          ip,
          reason as details
        FROM user_login_logs
        ORDER BY loginAt DESC
        LIMIT 100
      `).all();

      if (loginLogs.results) {
        logs.push(...loginLogs.results.map((r: any) => ({
          id: `login-${r.id}`,
          timestamp: r.timestamp,
          level: r.level,
          category: r.category,
          user: r.user || 'unknown',
          action: r.action,
          ip: r.ip || 'N/A',
          details: r.details || ''
        })));
      }
    } catch (e) {
      console.log("⚠️ user_login_logs 테이블 없음:", e);
    }

    // 3. 관리자 봇 할당 로그
    try {
      const botAssignments = await DB.prepare(`
        SELECT 
          id,
          createdAt as timestamp,
          'success' as level,
          'AI 봇 관리' as category,
          assignedBy as user,
          'AI 봇 할당 (학원)' as action,
          'N/A' as ip,
          ('학원 ID: ' || academyId || ', 봇 ID: ' || botId) as details
        FROM bot_assignments
        ORDER BY createdAt DESC
        LIMIT 100
      `).all();

      if (botAssignments.results) {
        logs.push(...botAssignments.results.map((r: any) => ({
          id: `bot-${r.id}`,
          timestamp: r.timestamp,
          level: r.level,
          category: r.category,
          user: r.user || 'system',
          action: r.action,
          ip: r.ip,
          details: r.details
        })));
      }
    } catch (e) {
      console.log("⚠️ bot_assignments 테이블 없음:", e);
    }

    // 타임스탬프로 정렬
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // 페이지네이션
    const paginatedLogs = logs.slice(offset, offset + limit);

    // 통계
    const stats = {
      total: logs.length,
      success: logs.filter(l => l.level === 'success').length,
      info: logs.filter(l => l.level === 'info').length,
      warning: logs.filter(l => l.level === 'warning').length,
      error: logs.filter(l => l.level === 'error').length
    };

    return new Response(
      JSON.stringify({
        success: true,
        logs: paginatedLogs,
        stats,
        total: logs.length,
        limit,
        offset
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch logs:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch logs",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
