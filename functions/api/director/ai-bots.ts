interface Env {
  DB: D1Database;
}

// 학원장용 AI 봇 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 활성화된 봇 목록 조회
    const bots = await DB.prepare(`
      SELECT 
        id,
        name,
        description,
        profile_icon as profileIcon,
        status
      FROM ai_bots
      WHERE status = 'ACTIVE'
      ORDER BY created_at DESC
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        bots: bots.results || []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch bots:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch bots",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
