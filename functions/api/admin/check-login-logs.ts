interface Env {
  DB: D1Database;
}

// 로그인 로그 테이블 확인 및 모든 로그 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 테이블 스키마 확인
    const schema = await DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_login_logs'"
    ).first();

    // 모든 로그 조회
    const allLogs = await DB.prepare(
      "SELECT * FROM user_login_logs ORDER BY loginAt DESC LIMIT 10"
    ).all();

    return new Response(
      JSON.stringify({
        tableExists: !!schema,
        schema: schema?.sql,
        totalLogs: allLogs.results?.length || 0,
        recentLogs: allLogs.results || []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Debug login logs error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to debug",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
