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
  try {
    const { request, env } = context;
    const { DB } = env;
    const botId = context.params.id as string;

    // 인증 확인
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "인증이 필요합니다." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🗑️ Deleting AI bot: ${botId}`);

    // 봇 존재 확인
    const existingBot = await DB.prepare(`
      SELECT id, name FROM ai_bots WHERE id = ?
    `).bind(botId).first();

    if (!existingBot) {
      return new Response(
        JSON.stringify({ error: "Bot not found", message: "봇을 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found bot to delete: ${existingBot.name}`);

    // 삭제 실행
    await DB.prepare(`
      DELETE FROM ai_bots WHERE id = ?
    `).bind(botId).run();

    console.log(`✅ Bot deleted successfully: ${existingBot.name}`);

    return new Response(
      JSON.stringify({ success: true, message: "AI bot deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot deletion error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
