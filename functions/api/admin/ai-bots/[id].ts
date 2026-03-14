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

    console.log(`🗑️ Delete request for bot ID: ${botId}`);

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

    // 봇 존재 확인
    console.log(`🔍 Checking if bot exists: ${botId}`);
    const existingBot = await DB.prepare(`
      SELECT id, name FROM ai_bots WHERE id = ?
    `).bind(botId).first();

    if (!existingBot) {
      console.error(`❌ Bot not found: ${botId}`);
      return new Response(
        JSON.stringify({ error: "Bot not found", message: "봇을 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found bot: ${existingBot.name} (${existingBot.id})`);
    console.log(`🗑️ Deleting bot ${botId} and all related data...`);

    // 1. Delete from ai_bot_assignments
    try {
      const result1 = await DB.prepare(`
        DELETE FROM ai_bot_assignments WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result1.meta?.changes || 0} ai_bot_assignments`);
    } catch (e: any) {
      console.log(`⚠️ ai_bot_assignments: ${e.message}`);
    }

    // 2. Delete from bot_assignments
    try {
      const result2 = await DB.prepare(`
        DELETE FROM bot_assignments WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result2.meta?.changes || 0} bot_assignments`);
    } catch (e: any) {
      console.log(`⚠️ bot_assignments: ${e.message}`);
    }

    // 3. Delete from user_bot_assignments
    try {
      const result3 = await DB.prepare(`
        DELETE FROM user_bot_assignments WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result3.meta?.changes || 0} user_bot_assignments`);
    } catch (e: any) {
      console.log(`⚠️ user_bot_assignments: ${e.message}`);
    }

    // 4. Delete from knowledge_base_chunks
    try {
      const result4 = await DB.prepare(`
        DELETE FROM knowledge_base_chunks WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result4.meta?.changes || 0} knowledge_base_chunks`);
    } catch (e: any) {
      console.log(`⚠️ knowledge_base_chunks: ${e.message}`);
    }

    // 5. Delete from bot_usage_logs
    try {
      const result5 = await DB.prepare(`
        DELETE FROM bot_usage_logs WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result5.meta?.changes || 0} bot_usage_logs`);
    } catch (e: any) {
      console.log(`⚠️ bot_usage_logs: ${e.message}`);
    }

    // 6. Delete from ai_chat_logs
    try {
      const result6 = await DB.prepare(`
        DELETE FROM ai_chat_logs WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result6.meta?.changes || 0} ai_chat_logs`);
    } catch (e: any) {
      console.log(`⚠️ ai_chat_logs: ${e.message}`);
    }

    // 7. Delete from chat_sessions
    try {
      const result7 = await DB.prepare(`
        DELETE FROM chat_sessions WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result7.meta?.changes || 0} chat_sessions`);
    } catch (e: any) {
      console.log(`⚠️ chat_sessions: ${e.message}`);
    }

    // 8. Delete from chat_messages
    try {
      const result8 = await DB.prepare(`
        DELETE FROM chat_messages WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result8.meta?.changes || 0} chat_messages`);
    } catch (e: any) {
      console.log(`⚠️ chat_messages: ${e.message}`);
    }

    // 9. Delete from bot_purchase_requests
    try {
      const result9 = await DB.prepare(`
        DELETE FROM bot_purchase_requests WHERE botId = ?
      `).bind(botId).run();
      console.log(`✅ Deleted ${result9.meta?.changes || 0} bot_purchase_requests`);
    } catch (e: any) {
      console.log(`⚠️ bot_purchase_requests: ${e.message}`);
    }

    // 10. Finally, delete the bot itself
    console.log(`🗑️ Executing DELETE query for bot...`);
    const deleteResult = await DB.prepare(`
      DELETE FROM ai_bots WHERE id = ?
    `).bind(botId).run();
    
    console.log(`✅ Deleted bot from ai_bots`);
    console.log(`📊 Delete result:`, JSON.stringify(deleteResult));
    
    // 삭제 확인
    const checkDeleted = await DB.prepare(`
      SELECT id FROM ai_bots WHERE id = ?
    `).bind(botId).first();

    if (checkDeleted) {
      console.error(`❌ Bot still exists after delete: ${botId}`);
      return new Response(
        JSON.stringify({ 
          error: "Delete verification failed", 
          message: "삭제 후에도 봇이 여전히 존재합니다." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Bot deleted and verified: ${existingBot.name}`);
    console.log(`🎉 Bot ${botId} and all related data deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "AI bot deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ AI bot deletion error:", error);
    console.error("❌ Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete AI bot",
        message: error.message || "알 수 없는 오류",
        details: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
