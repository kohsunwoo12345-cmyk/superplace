interface Env {
  DB: D1Database;
}

// 시스템 설정 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 설정 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        category TEXT,
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 모든 설정 조회
    const settingsResult = await DB.prepare(
      `SELECT key, value, category FROM system_settings`
    ).all();

    const settingsArray = settingsResult?.results || [];
    const settings: Record<string, any> = {};
    
    settingsArray.forEach((setting: any) => {
      settings[setting.key] = setting.value;
    });

    return new Response(JSON.stringify({ settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Settings fetch error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch settings",
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// 시스템 설정 저장
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json() as any;

    const { category, settings } = body;

    if (!settings) {
      return new Response(
        JSON.stringify({ error: "Settings are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 각 설정을 업데이트 또는 삽입
    for (const [key, value] of Object.entries(settings)) {
      await DB.prepare(`
        INSERT OR REPLACE INTO system_settings (key, value, category, updatedAt)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(key, String(value), category || 'general').run();
    }

    return new Response(
      JSON.stringify({ success: true, message: "Settings saved successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Settings save error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to save settings",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
