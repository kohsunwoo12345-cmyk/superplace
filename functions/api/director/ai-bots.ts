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

    // 🔥 학원에 할당된 봇 목록 조회 (academyId 기준)
    // academy_assignments 테이블 또는 bot_assignments 테이블에서 조회
    const assignments = await DB.prepare(`
      SELECT DISTINCT ba.botId
      FROM bot_assignments ba
      WHERE ba.academyId = ?
        AND ba.isActive = 1
        AND (ba.expiresAt IS NULL OR datetime(ba.expiresAt) > datetime('now'))
    `).bind(academyId).all();

    console.log(`🔍 Found ${assignments.results?.length || 0} bot assignments for academy ${academyId}`);

    // 🔥 만약 할당이 없다면, academy_assignments 테이블 확인
    let botIds: number[] = [];
    
    if (!assignments.results || assignments.results.length === 0) {
      console.log(`⚠️ No bot_assignments found, checking academy_assignments table...`);
      
      const academyAssignments = await DB.prepare(`
        SELECT DISTINCT aa.botId
        FROM academy_assignments aa
        WHERE aa.academyId = ?
          AND aa.isActive = 1
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

    // 할당된 봇들의 상세 정보 조회
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

    console.log(`✅ Found ${bots.results?.length || 0} active bots for assignment`);

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
