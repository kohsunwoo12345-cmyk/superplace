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

    // Step 1: 모든 관련 테이블 삭제 (여러 번 시도)
    const tables = [
      'ai_bot_assignments', 
      'bot_assignments', 
      'user_bot_assignments',
      'knowledge_base_chunks', 
      'bot_usage_logs', 
      'ai_chat_logs',
      'chat_sessions', 
      'chat_messages', 
      'bot_purchase_requests',
      'AcademyBotSubscription' // productId로 참조
    ];

    let totalDeleted = 0;
    
    // 각 테이블을 3번씩 시도해서 완전히 삭제
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`\n🔄 Attempt ${attempt}/3`);
      
      for (const table of tables) {
        try {
          let sql = `DELETE FROM ${table} WHERE `;
          sql += table === 'AcademyBotSubscription' ? 'productId = ?' : 'botId = ?';
          
          const result = await DB.prepare(sql).bind(botId).run();
          const changes = result.meta?.changes || 0;
          
          if (changes > 0) {
            console.log(`✅ ${table}: deleted ${changes} rows`);
            totalDeleted += changes;
          }
        } catch (e: any) {
          console.log(`⚠️ ${table}: ${e.message}`);
        }
      }
    }

    // Step 2: 이제 봇 삭제 시도
    console.log(`\n🗑️ Attempting to delete bot...`);
    try {
      const deleteResult = await DB.prepare(`DELETE FROM ai_bots WHERE id = ?`).bind(botId).run();
      const botDeleted = deleteResult.meta?.changes || 0;
      console.log(`✅ Bot deletion result: ${botDeleted} rows affected`);
    } catch (e: any) {
      console.error(`❌ Bot deletion failed: ${e.message}`);
      
      // 실패해도 강제로 다시 시도
      console.log(`🔥 Trying with exec...`);
      try {
        await DB.exec(`DELETE FROM ai_bots WHERE id = '${botId}'`);
        console.log(`✅ Exec deletion succeeded`);
      } catch (e2: any) {
        console.error(`❌ Exec also failed: ${e2.message}`);
        throw new Error(`Failed to delete bot: ${e.message}`);
      }
    }

    // Step 3: 확인
    // Step 3: 확인
    console.log(`\n🔍 Verifying deletion...`);
    const check = await DB.prepare(`SELECT COUNT(*) as count FROM ai_bots WHERE id = ?`).bind(botId).first();
    const stillExists = (check?.count as number) > 0;

    if (stillExists) {
      console.error(`❌ VERIFICATION FAILED: Bot still exists after deletion!`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Bot still exists after deletion attempts",
          botId,
          relatedDeleted: totalDeleted
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ SUCCESS: Bot completely deleted`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bot deleted successfully",
        botId,
        relatedDeleted: totalDeleted,
        verified: true
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Fatal Error:', error);
    console.error('Stack:', error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
        details: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
