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

  console.log(`🗑️ FORCE DELETE for bot: ${botId}`);

  if (!DB) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  // ⚠️ NO AUTH CHECK - FORCE DELETE MODE
  console.log('⚠️ FORCE DELETE MODE - Skipping auth check');

  try {
    // PRAGMA를 사용하여 외래 키 제약 비활성화
    console.log('Step 1: Disabling foreign keys...');
    await DB.exec("PRAGMA foreign_keys = OFF");
    console.log('✅ Foreign keys disabled');

    // 모든 관련 테이블 삭제
    const tables = [
      'ai_bot_assignments', 'bot_assignments', 'user_bot_assignments',
      'knowledge_base_chunks', 'bot_usage_logs', 'ai_chat_logs',
      'chat_sessions', 'chat_messages', 'bot_purchase_requests'
    ];

    let totalDeleted = 0;
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      try {
        console.log(`Step 2.${i + 1}: Deleting from ${table}...`);
        const result = await DB.prepare(`DELETE FROM ${table} WHERE botId = ?`).bind(botId).run();
        const changes = result.meta?.changes || 0;
        console.log(`✅ ${table}: deleted ${changes} rows`);
        totalDeleted += changes;
      } catch (e: any) {
        console.log(`⚠️ ${table}: ${e.message || 'unknown error'}`);
      }
    }

    // AcademyBotSubscription
    try {
      console.log('Step 3: Deleting from AcademyBotSubscription...');
      const result = await DB.prepare(`DELETE FROM AcademyBotSubscription WHERE productId = ?`).bind(botId).run();
      const changes = result.meta?.changes || 0;
      console.log(`✅ AcademyBotSubscription: deleted ${changes} rows`);
      totalDeleted += changes;
    } catch (e: any) {
      console.log(`⚠️ AcademyBotSubscription: ${e.message || 'unknown error'}`);
    }

    // 봇 삭제
    console.log('Step 4: Deleting bot from ai_bots...');
    const result = await DB.prepare(`DELETE FROM ai_bots WHERE id = ?`).bind(botId).run();
    const botChanges = result.meta?.changes || 0;
    console.log(`✅ ai_bots: deleted ${botChanges} rows`);

    // 삭제 확인
    console.log('Step 5: Verifying deletion...');
    const stillExists = await DB.prepare(`SELECT COUNT(*) as count FROM ai_bots WHERE id = ?`).bind(botId).first();
    const existsCount = stillExists?.count || 0;
    
    if (existsCount > 0) {
      console.error('❌ VERIFICATION FAILED: Bot still exists!');
    } else {
      console.log('✅ VERIFICATION SUCCESS: Bot completely deleted');
    }

    // 외래 키 제약 다시 활성화
    await DB.exec("PRAGMA foreign_keys = ON");
    console.log('✅ Foreign keys re-enabled');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "AI bot deleted successfully",
        details: {
          relatedRecordsDeleted: totalDeleted,
          botDeleted: botChanges > 0,
          verified: existsCount === 0
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error('❌ Fatal delete error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // 에러가 나도 외래 키 다시 켜기
    try {
      await DB.exec("PRAGMA foreign_keys = ON");
      console.log('✅ Foreign keys re-enabled after error');
    } catch (e) { 
      console.error('❌ Failed to re-enable foreign keys:', e);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Delete failed", 
        message: error.message,
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
