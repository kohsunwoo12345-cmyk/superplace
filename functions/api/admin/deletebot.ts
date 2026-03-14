// GET 방식 강제 삭제 엔드포인트
interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  const DB = env.DB;

  if (!DB) {
    return new Response(
      JSON.stringify({ error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(request.url);
    const botId = url.searchParams.get('botId');

    if (!botId) {
      return new Response(
        JSON.stringify({ error: "botId query parameter is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔥 FORCE DELETE bot: ${botId}`);

    // 외래 키 제약 비활성화
    await DB.exec("PRAGMA foreign_keys = OFF");
    console.log('✅ Foreign keys disabled');

    // 관련 테이블 삭제
    const tables = [
      'ai_bot_assignments', 'bot_assignments', 'user_bot_assignments',
      'knowledge_base_chunks', 'bot_usage_logs', 'ai_chat_logs',
      'chat_sessions', 'chat_messages', 'bot_purchase_requests'
    ];

    let totalDeleted = 0;
    for (const table of tables) {
      try {
        const result = await DB.prepare(`DELETE FROM ${table} WHERE botId = ?`).bind(botId).run();
        const changes = result.meta?.changes || 0;
        console.log(`✅ ${table}: ${changes} rows`);
        totalDeleted += changes;
      } catch (e: any) {
        console.log(`⚠️ ${table}: ${e.message}`);
      }
    }

    // AcademyBotSubscription
    try {
      const result = await DB.prepare(`DELETE FROM AcademyBotSubscription WHERE productId = ?`).bind(botId).run();
      totalDeleted += result.meta?.changes || 0;
    } catch (e) {}

    // 봇 삭제
    const deleteResult = await DB.prepare(`DELETE FROM ai_bots WHERE id = ?`).bind(botId).run();
    const botDeleted = deleteResult.meta?.changes || 0;
    console.log(`✅ Bot deleted: ${botDeleted} rows`);

    // 확인
    const check = await DB.prepare(`SELECT COUNT(*) as count FROM ai_bots WHERE id = ?`).bind(botId).first();
    const stillExists = (check?.count as number) > 0;

    // 외래 키 다시 활성화
    await DB.exec("PRAGMA foreign_keys = ON");
    console.log('✅ Foreign keys re-enabled');

    return new Response(
      JSON.stringify({
        success: !stillExists,
        message: stillExists ? "Bot still exists" : "Bot deleted successfully",
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
        error: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
