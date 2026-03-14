// 강제 삭제 전용 엔드포인트 (인증 없음)
interface Env {
  DB: D1Database;
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  const { DB } = env;

  try {
    const body = await request.json();
    const { botId } = body;

    if (!botId) {
      return new Response(
        JSON.stringify({ error: "botId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔥 FORCE DELETE bot: ${botId}`);

    // 1. 외래 키 제약 비활성화
    await DB.exec("PRAGMA foreign_keys = OFF");
    console.log('✅ Step 1: Foreign keys disabled');

    // 2. 관련 테이블에서 삭제
    const tables = [
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

    let totalDeleted = 0;
    for (const table of tables) {
      try {
        const result = await DB.prepare(`DELETE FROM ${table} WHERE botId = ?`).bind(botId).run();
        const changes = result.meta?.changes || 0;
        console.log(`✅ ${table}: ${changes} rows deleted`);
        totalDeleted += changes;
      } catch (e: any) {
        console.log(`⚠️ ${table}: ${e.message}`);
      }
    }

    // 3. AcademyBotSubscription (productId)
    try {
      const result = await DB.prepare(`DELETE FROM AcademyBotSubscription WHERE productId = ?`).bind(botId).run();
      const changes = result.meta?.changes || 0;
      console.log(`✅ AcademyBotSubscription: ${changes} rows deleted`);
      totalDeleted += changes;
    } catch (e: any) {
      console.log(`⚠️ AcademyBotSubscription: ${e.message}`);
    }

    // 4. 봇 삭제
    const deleteResult = await DB.prepare(`DELETE FROM ai_bots WHERE id = ?`).bind(botId).run();
    const botDeleted = deleteResult.meta?.changes || 0;
    console.log(`✅ ai_bots: ${botDeleted} rows deleted`);

    // 5. 확인
    const check = await DB.prepare(`SELECT COUNT(*) as count FROM ai_bots WHERE id = ?`).bind(botId).first();
    const stillExists = (check?.count as number) > 0;

    // 6. 외래 키 다시 활성화
    await DB.exec("PRAGMA foreign_keys = ON");
    console.log('✅ Step 6: Foreign keys re-enabled');

    if (stillExists) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bot still exists after deletion",
          botId,
          relatedDeleted: totalDeleted,
          botDeleted: botDeleted > 0
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bot successfully deleted",
        botId,
        relatedDeleted: totalDeleted,
        botDeleted: botDeleted > 0,
        verified: !stillExists
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    
    try {
      await env.DB.exec("PRAGMA foreign_keys = ON");
    } catch (e) {}

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
