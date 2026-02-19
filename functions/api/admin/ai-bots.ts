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
        starterMessage1 TEXT,
        starterMessage2 TEXT,
        starterMessage3 TEXT,
        profileIcon TEXT DEFAULT '🤖',
        profileImage TEXT,
        model TEXT DEFAULT 'gemini-2.5-flash',
        temperature REAL DEFAULT 0.7,
        maxTokens INTEGER DEFAULT 2000,
        topK INTEGER DEFAULT 40,
        topP REAL DEFAULT 0.95,
        language TEXT DEFAULT 'ko',
        enableProblemGeneration INTEGER DEFAULT 0,
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

    // enableProblemGeneration을 명시적으로 숫자로 변환
    const bots = (botsResult?.results || []).map((bot: any) => ({
      ...bot,
      enableProblemGeneration: bot.enableProblemGeneration ? Number(bot.enableProblemGeneration) : 0,
      isActive: bot.isActive ? Number(bot.isActive) : 0,
      temperature: bot.temperature ? Number(bot.temperature) : 0.7,
      maxTokens: bot.maxTokens ? Number(bot.maxTokens) : 2000,
      topK: bot.topK ? Number(bot.topK) : 40,
      topP: bot.topP ? Number(bot.topP) : 0.95
    }));

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
      starterMessage1,
      starterMessage2,
      starterMessage3,
      profileIcon = "🤖",
      profileImage = "",
      model = "gemini-2.5-flash",
      temperature = 0.7,
      maxTokens = 2000,
      topK = 40,
      topP = 0.95,
      language = "ko",
      enableProblemGeneration = false,
    } = body;

    if (!name || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Name and systemPrompt are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const botId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Try to add enableProblemGeneration column if it doesn't exist
    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN enableProblemGeneration INTEGER DEFAULT 0
      `).run();
      console.log('✅ enableProblemGeneration column added successfully');
    } catch (alterError: any) {
      // Column already exists or other error - continue anyway
      console.log('ℹ️ Column add attempt:', alterError.message);
    }

    // Try with enableProblemGeneration first
    try {
      await DB.prepare(`
        INSERT INTO ai_bots (
          id, name, description, systemPrompt, welcomeMessage, 
          starterMessage1, starterMessage2, starterMessage3, profileIcon, profileImage,
          model, temperature, maxTokens, topK, topP, language,
          enableProblemGeneration, isActive, conversationCount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
      `).bind(
        botId,
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
        enableProblemGeneration ? 1 : 0
      ).run();

      console.log('✅ AI bot created with enableProblemGeneration');
    } catch (insertError: any) {
      // If enableProblemGeneration column doesn't exist, try without it
      if (insertError.message?.includes('enableProblemGeneration')) {
        console.log('⚠️ Retrying without enableProblemGeneration column');
        await DB.prepare(`
          INSERT INTO ai_bots (
            id, name, description, systemPrompt, welcomeMessage, 
            starterMessage1, starterMessage2, starterMessage3, profileIcon, profileImage,
            model, temperature, maxTokens, topK, topP, language,
            isActive, conversationCount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        `).bind(
          botId,
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
          language
        ).run();
        console.log('✅ AI bot created without enableProblemGeneration (feature disabled)');
      } else {
        throw insertError;
      }
    }

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
