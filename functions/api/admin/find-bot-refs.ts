// 특정 botId를 참조하는 모든 레코드 찾기
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

    console.log(`🔍 Finding all references to bot: ${botId}`);

    const results: any = {};

    // 모든 가능한 테이블 확인
    const tablesToCheck = [
      { table: 'ai_bot_assignments', column: 'botId' },
      { table: 'bot_assignments', column: 'botId' },
      { table: 'user_bot_assignments', column: 'botId' },
      { table: 'knowledge_base_chunks', column: 'botId' },
      { table: 'bot_usage_logs', column: 'botId' },
      { table: 'ai_chat_logs', column: 'botId' },
      { table: 'chat_sessions', column: 'botId' },
      { table: 'chat_messages', column: 'botId' },
      { table: 'bot_purchase_requests', column: 'botId' },
      { table: 'AcademyBotSubscription', column: 'productId' },
      { table: 'ai_bots', column: 'id' },
    ];

    for (const { table, column } of tablesToCheck) {
      try {
        const result = await DB.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${column} = ?`).bind(botId).first();
        const count = result?.count || 0;
        results[table] = count;
        console.log(`${table}.${column}: ${count} rows`);
      } catch (e: any) {
        results[table] = `ERROR: ${e.message}`;
        console.log(`${table}: ERROR - ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        botId,
        references: results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
