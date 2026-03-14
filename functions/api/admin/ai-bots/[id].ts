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

  console.log(`🗑️ STARTING FORCE DELETE for bot: ${botId}`);
  
  // 먼저 봇이 존재하는지 확인
  let botExists = false;
  try {
    const existingBot = await DB.prepare(`SELECT id, name FROM ai_bots WHERE id = ?`).bind(botId).first();
    if (existingBot) {
      botExists = true;
      console.log(`✅ Bot found: ${JSON.stringify(existingBot)}`);
    } else {
      console.log(`❌ Bot not found with id: ${botId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Bot not found",
          message: "해당 봇을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다."
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (e: any) {
    console.error(`❌ Error checking bot existence: ${e.message}`);
  }
  
  // 순서대로 하나씩 삭제 (에러 무시)
  const deleteSteps = [
    { table: 'ai_bot_assignments', column: 'botId' },
    { table: 'bot_assignments', column: 'botId' },
    { table: 'user_bot_assignments', column: 'botId' },
    { table: 'knowledge_base_chunks', column: 'botId' },
    { table: 'bot_usage_logs', column: 'botId' },
    { table: 'ai_chat_logs', column: 'botId' },
    { table: 'chat_sessions', column: 'botId' },
    { table: 'chat_messages', column: 'botId' },
    { table: 'bot_purchase_requests', column: 'botId' },
    { table: 'AcademyBotSubscription', column: 'productId' }
  ];

  let deletedCount = 0;
  const errors: string[] = [];
  
  for (const step of deleteSteps) {
    try {
      const result = await DB.prepare(
        `DELETE FROM ${step.table} WHERE ${step.column} = ?`
      ).bind(botId).run();
      const changes = result.meta?.changes || 0;
      deletedCount += changes;
      console.log(`✅ ${step.table}: deleted ${changes} rows`);
    } catch (e: any) {
      const errorMsg = `${step.table}: ${e.message}`;
      console.log(`⚠️ ${errorMsg}`);
      errors.push(errorMsg);
      // 테이블이 없어도 계속 진행
    }
  }

  console.log(`📊 Total related records deleted: ${deletedCount}`);
  if (errors.length > 0) {
    console.log(`⚠️ Errors encountered: ${errors.join(', ')}`);
  }
  
  // 이제 봇 자체를 삭제
  console.log(`🎯 Deleting bot from ai_bots table...`);
  let botDeleted = false;
  let deleteError: string | null = null;
  
  try {
    const result = await DB.prepare(`DELETE FROM ai_bots WHERE id = ?`).bind(botId).run();
    const changes = result.meta?.changes || 0;
    botDeleted = changes > 0;
    console.log(`✅ Bot deletion result: ${changes} row(s) affected`);
    
    if (changes === 0) {
      deleteError = "DELETE query returned 0 changes - bot may not exist or FK constraint blocking";
      console.error(`❌ ${deleteError}`);
    }
  } catch (e: any) {
    deleteError = e.message;
    console.error(`❌ Bot deletion exception: ${e.message}`);
    console.error(`Stack: ${e.stack}`);
  }

  // 삭제 확인
  let stillExists = false;
  try {
    const check = await DB.prepare(`SELECT id FROM ai_bots WHERE id = ?`).bind(botId).first();
    if (check) {
      stillExists = true;
      console.error(`❌ CRITICAL: Bot still exists after deletion!`);
      console.error(`Bot data: ${JSON.stringify(check)}`);
    } else {
      console.log(`✅ VERIFIED: Bot no longer exists in database`);
    }
  } catch (e: any) {
    console.log(`⚠️ Verification check failed: ${e.message}`);
  }

  console.log(`🎉 DELETE operation completed for bot: ${botId}`);

  // 실패한 경우 에러 반환
  if (stillExists || !botDeleted) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Deletion failed",
        message: `봇 삭제에 실패했습니다. ${deleteError || '알 수 없는 오류'}`,
        details: {
          deletedRelatedRecords: deletedCount,
          botDeleted: botDeleted,
          stillExists: stillExists,
          deleteError: deleteError,
          errors: errors
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "AI bot deleted successfully",
      deletedRelatedRecords: deletedCount,
      botDeleted: botDeleted
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
