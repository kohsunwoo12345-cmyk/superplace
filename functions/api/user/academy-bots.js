// API: 학원별 할당된 AI 봇 조회 (간소화 버전)
// GET /api/user/academy-bots?academyId=xxx

export async function onRequestGet(context) {
  const db = context.env.DB;
  
  try {
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");

    if (!academyId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "academyId가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔍 학원 봇 조회 - academyId: ${academyId}`);

    // AcademyBotSubscription에서 할당된 봇 조회
    const subscriptions = await db.prepare(`
      SELECT botId FROM AcademyBotSubscription
      WHERE academyId = ?
        AND isActive = 1
        AND date(subscriptionEnd) >= date('now')
    `).bind(academyId).all();

    if (!subscriptions.results || subscriptions.results.length === 0) {
      console.log('⚠️ 할당된 구독이 없습니다');
      return new Response(
        JSON.stringify({
          success: true,
          bots: [],
          count: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 봇 ID 목록 - botId가 null인 경우 제외
    const botIds = subscriptions.results
      .map(s => s.botId)
      .filter(id => id && id !== null && id !== 'null');
    
    if (botIds.length === 0) {
      console.log('⚠️ 유효한 botId가 없습니다');
      return new Response(
        JSON.stringify({
          success: true,
          bots: [],
          count: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`✅ 할당된 봇 ID: ${botIds.join(', ')}`);

    // 봇 정보 조회
    const placeholders = botIds.map(() => '?').join(',');
    const { results } = await db.prepare(`
      SELECT 
        id, name, description, systemPrompt, welcomeMessage,
        starterMessage1, starterMessage2, starterMessage3,
        profileIcon, profileImage, model, temperature,
        maxTokens, topK, topP, language, isActive,
        enableProblemGeneration, voiceEnabled, voiceName, knowledgeBase
      FROM ai_bots
      WHERE id IN (${placeholders})
        AND isActive = 1
      ORDER BY name ASC
    `).bind(...botIds).all();

    const bots = (results || []).map((bot) => ({
      ...bot,
      enableProblemGeneration: bot.enableProblemGeneration ? Number(bot.enableProblemGeneration) : 0,
      voiceEnabled: bot.voiceEnabled ? Number(bot.voiceEnabled) : 0,
      isActive: bot.isActive ? Number(bot.isActive) : 0,
      temperature: bot.temperature ? Number(bot.temperature) : 0.7,
      maxTokens: bot.maxTokens ? Number(bot.maxTokens) : 2000,
      topK: bot.topK ? Number(bot.topK) : 40,
      topP: bot.topP ? Number(bot.topP) : 0.95
    }));
    
    console.log(`✅ 최종 봇 ${bots.length}개 반환`);

    return new Response(
      JSON.stringify({
        success: true,
        bots: bots,
        count: bots.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("학원 봇 조회 오류:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
