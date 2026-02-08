interface Env {
  DB: D1Database;
}

// 사용자별 AI 채팅 기록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const botId = url.searchParams.get('botId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 채팅 기록 조회 (botId 필터 선택적)
    let query = `
      SELECT 
        id,
        userId,
        botId,
        botName,
        message,
        response,
        model,
        datetime(createdAt) as createdAt
      FROM ai_chat_logs
      WHERE userId = ?
    `;
    
    const params: any[] = [userId];
    
    if (botId) {
      query += ` AND botId = ?`;
      params.push(botId);
    }
    
    query += ` ORDER BY datetime(createdAt) DESC LIMIT ?`;
    params.push(limit);

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        logs: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch chat history error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch chat history",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
