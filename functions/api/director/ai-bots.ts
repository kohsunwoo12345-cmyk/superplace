interface Env {
  DB: D1Database;
}

// 학원장용 AI 봇 목록 조회 - 자신에게 할당된 봇만
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId'); // 학원장의 academy_id

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!academyId) {
      return new Response(
        JSON.stringify({ error: "academyId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📋 Fetching bots for academy ${academyId}`);

    // 학원에 할당된 활성 봇 목록 조회
    const assignments = await DB.prepare(`
      SELECT DISTINCT ba.botId
      FROM bot_assignments ba
      WHERE ba.academyId = ?
        AND ba.isActive = 1
        AND (ba.expiresAt IS NULL OR datetime(ba.expiresAt) > datetime('now'))
    `).bind(academyId).all();

    if (!assignments.results || assignments.results.length === 0) {
      console.log(`⚠️ No bot assignments found for academy ${academyId}`);
      return new Response(
        JSON.stringify({
          success: true,
          bots: []
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 할당된 봇들의 상세 정보 조회
    const botIds = assignments.results.map((a: any) => a.botId);
    const placeholders = botIds.map(() => '?').join(',');
    
    const bots = await DB.prepare(`
      SELECT 
        id,
        name,
        description,
        profile_icon as profileIcon,
        status
      FROM ai_bots
      WHERE id IN (${placeholders}) AND status = 'ACTIVE'
      ORDER BY created_at DESC
    `).bind(...botIds).all();

    console.log(`✅ Found ${bots.results?.length || 0} assigned bots`);

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
