interface Env {
  DB: D1Database;
}

// AI 봇 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // AI 봇 테이블이 없을 수 있으므로 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS ai_bots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        systemPrompt TEXT NOT NULL,
        welcomeMessage TEXT,
        model TEXT DEFAULT 'gpt-4',
        temperature REAL DEFAULT 0.7,
        maxTokens INTEGER DEFAULT 2000,
        isActive INTEGER DEFAULT 1,
        conversationCount INTEGER DEFAULT 0,
        lastUsedAt TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 모든 AI 봇 조회
    const botsResult = await DB.prepare(
      `SELECT * FROM ai_bots ORDER BY datetime(createdAt) DESC`
    ).all();

    const bots = botsResult?.results || [];

    return new Response(JSON.stringify({ bots }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("AI bots list error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch AI bots",
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// AI 봇 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json() as any;

    const {
      name,
      description,
      systemPrompt,
      welcomeMessage,
      model = "gpt-4",
      temperature = 0.7,
      maxTokens = 2000,
    } = body;

    if (!name || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Name and systemPrompt are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const botId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await DB.prepare(`
      INSERT INTO ai_bots (
        id, name, description, systemPrompt, welcomeMessage, 
        model, temperature, maxTokens, isActive, conversationCount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `).bind(
      botId,
      name,
      description || null,
      systemPrompt,
      welcomeMessage || null,
      model,
      temperature,
      maxTokens
    ).run();

    return new Response(
      JSON.stringify({ success: true, botId, message: "AI bot created successfully" }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
