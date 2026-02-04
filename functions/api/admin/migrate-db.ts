interface Env {
  DB: D1Database;
}

/**
 * 데이터베이스 마이그레이션 API
 * POST /api/admin/migrate-db
 * 기존 ai_bots 테이블에 새로운 컬럼 추가
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const migrations: string[] = [];
    const errors: any[] = [];

    // 1. starterMessage1, starterMessage2, starterMessage3 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN starterMessage1 TEXT
      `).run();
      migrations.push("Added starterMessage1 column");
    } catch (error: any) {
      if (!error.message.includes("duplicate column name")) {
        errors.push({ column: "starterMessage1", error: error.message });
      } else {
        migrations.push("starterMessage1 column already exists");
      }
    }

    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN starterMessage2 TEXT
      `).run();
      migrations.push("Added starterMessage2 column");
    } catch (error: any) {
      if (!error.message.includes("duplicate column name")) {
        errors.push({ column: "starterMessage2", error: error.message });
      } else {
        migrations.push("starterMessage2 column already exists");
      }
    }

    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN starterMessage3 TEXT
      `).run();
      migrations.push("Added starterMessage3 column");
    } catch (error: any) {
      if (!error.message.includes("duplicate column name")) {
        errors.push({ column: "starterMessage3", error: error.message });
      } else {
        migrations.push("starterMessage3 column already exists");
      }
    }

    // 2. profileIcon 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN profileIcon TEXT DEFAULT '🤖'
      `).run();
      migrations.push("Added profileIcon column");
    } catch (error: any) {
      if (!error.message.includes("duplicate column name")) {
        errors.push({ column: "profileIcon", error: error.message });
      } else {
        migrations.push("profileIcon column already exists");
      }
    }

    // 3. topK 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN topK INTEGER DEFAULT 40
      `).run();
      migrations.push("Added topK column");
    } catch (error: any) {
      if (!error.message.includes("duplicate column name")) {
        errors.push({ column: "topK", error: error.message });
      } else {
        migrations.push("topK column already exists");
      }
    }

    // 4. topP 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN topP REAL DEFAULT 0.95
      `).run();
      migrations.push("Added topP column");
    } catch (error: any) {
      if (!error.message.includes("duplicate column name")) {
        errors.push({ column: "topP", error: error.message });
      } else {
        migrations.push("topP column already exists");
      }
    }

    // 5. language 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE ai_bots ADD COLUMN language TEXT DEFAULT 'ko'
      `).run();
      migrations.push("Added language column");
    } catch (error: any) {
      if (!error.message.includes("duplicate column name")) {
        errors.push({ column: "language", error: error.message });
      } else {
        migrations.push("language column already exists");
      }
    }

    // 6. 테이블 스키마 확인
    const schemaResult = await DB.prepare(`
      PRAGMA table_info(ai_bots)
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database migration completed",
        migrations,
        errors,
        currentSchema: schemaResult.results,
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
        error: "Failed to migrate database",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
