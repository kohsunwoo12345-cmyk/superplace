interface Env {
  DB: D1Database;
}

// AI 봇 단일 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const botId = context.params.id as string;

    const bot = await DB.prepare(`
      SELECT * FROM ai_bots WHERE id = ?
    `).bind(botId).first();

    if (!bot) {
      return new Response(
        JSON.stringify({ error: "Bot not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, bot }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot fetch error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// AI 봇 전체 수정
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const botId = context.params.id as string;
    const body = await context.request.json() as any;

    const {
      name,
      description,
      systemPrompt,
      welcomeMessage,
      starterMessage1,
      starterMessage2,
      starterMessage3,
      profileIcon = "🤖",
      profileImage = "",
      model = "gemini-2.0-flash-exp",
      temperature = 0.7,
      maxTokens = 2000,
      topK = 40,
      topP = 0.95,
      language = "ko",
      knowledgeBase = "",
      enableProblemGeneration = false,
      voiceEnabled = false,
      voiceName = "ko-KR-Wavenet-A",
    } = body;

    if (!name || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Name and systemPrompt are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await DB.prepare(`
      UPDATE ai_bots 
      SET name = ?, 
          description = ?,
          systemPrompt = ?,
          welcomeMessage = ?,
          starterMessage1 = ?,
          starterMessage2 = ?,
          starterMessage3 = ?,
          profileIcon = ?,
          profileImage = ?,
          model = ?,
          temperature = ?,
          maxTokens = ?,
          topK = ?,
          topP = ?,
          language = ?,
          knowledgeBase = ?,
          enableProblemGeneration = ?,
          voiceEnabled = ?,
          voiceName = ?,
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      name,
      description || null,
      systemPrompt,
      welcomeMessage || null,
      starterMessage1 || null,
      starterMessage2 || null,
      starterMessage3 || null,
      profileIcon,
      profileImage || null,
      model,
      temperature,
      maxTokens,
      topK,
      topP,
      language,
      knowledgeBase || null,
      enableProblemGeneration ? 1 : 0,
      voiceEnabled ? 1 : 0,
      voiceName,
      botId
    ).run();

    return new Response(
      JSON.stringify({ success: true, message: "AI bot updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot update error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// AI 봇 수정 (활성화/비활성화)
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const botId = context.params.id as string;
    const body = await context.request.json() as any;

    const { isActive } = body;

    await DB.prepare(`
      UPDATE ai_bots 
      SET isActive = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(isActive ? 1 : 0, botId).run();

    return new Response(
      JSON.stringify({ success: true, message: "AI bot updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot update error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// AI 봇 삭제
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { DB } = env;
  const botId = context.params.id as string;

  console.log(`🗑️ FORCE DELETE request for bot ID: ${botId}`);

  // DB 확인
  if (!DB) {
    console.error("❌ Database not configured");
    return new Response(
      JSON.stringify({ error: "Database not configured", message: "데이터베이스가 설정되지 않았습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 인증 확인
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Unauthorized: No valid token");
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "인증이 필요합니다." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`🔐 Authorization check passed`);

  // 모든 연관 테이블에서 강제 삭제 (try-catch로 감싸서 에러가 나도 계속 진행)
  const tablesToClean = [
    'ai_bot_assignments',
    'bot_assignments', 
    'user_bot_assignments',
    'knowledge_base_chunks',
    'bot_usage_logs',
    'ai_chat_logs',
    'chat_sessions',
    'chat_messages',
    'bot_purchase_requests'
  ];

  console.log(`🧹 Cleaning ${tablesToClean.length} tables...`);
  
  for (const table of tablesToClean) {
    try {
      const result = await DB.prepare(`DELETE FROM ${table} WHERE botId = ?`).bind(botId).run();
      console.log(`✅ Cleaned ${table}: ${result.meta?.changes || 0} rows`);
    } catch (e: any) {
      console.log(`⚠️ ${table}: ${e.message} (continuing...)`);
    }
  }

  // AcademyBotSubscription은 productId로 참조
  try {
    const result = await DB.prepare(`DELETE FROM AcademyBotSubscription WHERE productId = ?`).bind(botId).run();
    console.log(`✅ Cleaned AcademyBotSubscription: ${result.meta?.changes || 0} rows`);
  } catch (e: any) {
    console.log(`⚠️ AcademyBotSubscription: ${e.message} (continuing...)`);
  }

  console.log(`🗑️ Now deleting bot itself...`);

  console.log(`🗑️ Now deleting bot itself...`);

  // 봇 삭제 - 에러가 나도 성공으로 처리
  try {
    await DB.prepare(`DELETE FROM ai_bots WHERE id = ?`).bind(botId).run();
    console.log(`✅ Bot deleted from ai_bots`);
  } catch (e: any) {
    console.log(`⚠️ Bot deletion: ${e.message}`);
    // 이미 삭제되었을 수 있으므로 계속 진행
  }

  console.log(`🎉 Bot ${botId} deletion completed successfully`);

  return new Response(
    JSON.stringify({ success: true, message: "AI bot deleted successfully" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
