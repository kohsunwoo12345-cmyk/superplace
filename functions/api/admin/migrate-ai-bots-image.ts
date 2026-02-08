interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // profileImage 컬럼 추가 (이미 존재하면 무시됨)
    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN profileImage TEXT
      `).run();
      
      console.log("✅ profileImage column added successfully");
    } catch (error: any) {
      // 이미 컬럼이 존재하면 에러 무시
      if (error.message.includes("duplicate column name")) {
        console.log("ℹ️ profileImage column already exists");
      } else {
        throw error;
      }
    }

    // 테이블 구조 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(ai_bots)
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Migration completed",
        tableInfo: tableInfo.results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        error: "Migration failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
