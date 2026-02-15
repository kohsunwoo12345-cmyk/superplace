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

    // 🔥 1단계: bot_assignments 테이블 조회 (academyId 기준)
    const assignments = await DB.prepare(`
      SELECT DISTINCT ba.botId
      FROM bot_assignments ba
      WHERE ba.academyId = ?
        AND (ba.expiresAt IS NULL OR datetime(ba.expiresAt) > datetime('now'))
    `).bind(academyId).all();

    console.log(`🔍 Found ${assignments.results?.length || 0} bot_assignments for academy ${academyId}`);

    // 🔥 2단계: 없으면 academy_assignments 테이블 조회 (폴백)
    let botIds: number[] = [];
    
    if (!assignments.results || assignments.results.length === 0) {
      console.log(`⚠️ No bot_assignments found, checking academy_assignments table...`);
      
      const academyAssignments = await DB.prepare(`
        SELECT DISTINCT aa.botId
        FROM academy_assignments aa
        WHERE aa.academyId = ?
          AND (aa.expiresAt IS NULL OR datetime(aa.expiresAt) > datetime('now'))
      `).bind(academyId).all();
      
      console.log(`🔍 Found ${academyAssignments.results?.length || 0} academy_assignments for academy ${academyId}`);
      
      if (!academyAssignments.results || academyAssignments.results.length === 0) {
        console.log(`⚠️ No bots assigned to academy ${academyId}`);
        return new Response(
          JSON.stringify({
            success: true,
            bots: [],
            message: "학원에 할당된 봇이 없습니다. 관리자에게 문의하세요."
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      botIds = academyAssignments.results.map((a: any) => a.botId);
    } else {
      botIds = assignments.results.map((a: any) => a.botId);
    }

    console.log(`📌 botIds to query:`, botIds);

    // 🔥 3단계: 할당된 봇들의 상세 정보 조회 (status 조건 제거하여 모든 봇 조회)
    const placeholders = botIds.map(() => '?').join(',');
    
    const bots = await DB.prepare(`
      SELECT 
        id,
        name,
        description,
        profile_icon as profileIcon,
        status,
        is_active as isActive
      FROM ai_bots
      WHERE id IN (${placeholders})
      ORDER BY created_at DESC
    `).bind(...botIds).all();

    console.log(`✅ Found ${bots.results?.length || 0} bots (before filtering):`, 
      bots.results?.map((b: any) => ({ id: b.id, name: b.name, status: b.status, isActive: b.isActive }))
    );

    // 🔥 4단계: ACTIVE 상태이거나 is_active=1인 봇만 필터링
    const activeBots = (bots.results || []).filter((bot: any) => {
      const isActiveStatus = bot.status === 'ACTIVE' || bot.status === 'active';
      const isActiveFlag = bot.isActive === 1 || bot.isActive === true;
      return isActiveStatus || isActiveFlag;
    });

    console.log(`✅ Filtered to ${activeBots.length} active bots:`,
      activeBots.map((b: any) => ({ id: b.id, name: b.name, status: b.status, isActive: b.isActive }))
    );

    return new Response(
      JSON.stringify({
        success: true,
        bots: activeBots,
        totalBots: bots.results?.length || 0,
        activeBotCount: activeBots.length
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
