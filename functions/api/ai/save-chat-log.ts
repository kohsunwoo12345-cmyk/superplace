interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json() as any;

    const { id, userId, botId, botName, message, response, model } = body;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // AI 대화 기록 테이블 생성 (없을 경우)
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS ai_chat_logs (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          botId TEXT,
          botName TEXT,
          message TEXT NOT NULL,
          response TEXT,
          model TEXT,
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
    } catch (createErr: any) {
      console.log('ℹ️ ai_chat_logs 테이블 생성 시도:', createErr.message);
    }

    // botId 컬럼 마이그레이션 (없을 경우 추가)
    try {
      await DB.prepare(`ALTER TABLE ai_chat_logs ADD COLUMN botId TEXT`).run();
      console.log('✅ ai_chat_logs.botId 컬럼 추가됨');
    } catch (alterErr: any) {
      // 이미 존재하면 무시
      if (!alterErr.message?.includes('duplicate column') && !alterErr.message?.includes('already exists')) {
        console.log('ℹ️ ai_chat_logs.botId 컬럼 이미 존재');
      }
    }

    // botName 컬럼 마이그레이션 (없을 경우 추가)
    try {
      await DB.prepare(`ALTER TABLE ai_chat_logs ADD COLUMN botName TEXT`).run();
      console.log('✅ ai_chat_logs.botName 컬럼 추가됨');
    } catch (alterErr: any) {
      if (!alterErr.message?.includes('duplicate column') && !alterErr.message?.includes('already exists')) {
        console.log('ℹ️ ai_chat_logs.botName 컬럼 이미 존재');
      }
    }

    // 채팅 로그 저장
    await DB.prepare(`
      INSERT INTO ai_chat_logs (id, userId, botId, botName, message, response, model)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userId, botId, botName, message, response, model).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Chat log saved successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Save chat log error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save chat log",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
