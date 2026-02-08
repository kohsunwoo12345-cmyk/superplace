interface Env {
  DB: D1Database;
}

// users 테이블에 lastLoginAt, lastLoginIp 컬럼 추가
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];

    // 1. lastLoginAt 컬럼 추가 시도
    try {
      await DB.prepare(`
        ALTER TABLE users ADD COLUMN lastLoginAt TEXT
      `).run();
      results.push("✅ lastLoginAt 컬럼 추가 완료");
    } catch (e: any) {
      if (e.message && e.message.includes("duplicate column")) {
        results.push("ℹ️ lastLoginAt 컬럼이 이미 존재합니다");
      } else {
        results.push(`⚠️ lastLoginAt 컬럼 추가 실패: ${e.message}`);
      }
    }

    // 2. lastLoginIp 컬럼 추가 시도
    try {
      await DB.prepare(`
        ALTER TABLE users ADD COLUMN lastLoginIp TEXT
      `).run();
      results.push("✅ lastLoginIp 컬럼 추가 완료");
    } catch (e: any) {
      if (e.message && e.message.includes("duplicate column")) {
        results.push("ℹ️ lastLoginIp 컬럼이 이미 존재합니다");
      } else {
        results.push(`⚠️ lastLoginIp 컬럼 추가 실패: ${e.message}`);
      }
    }

    // 3. users 테이블 스키마 확인
    const schema = await DB.prepare(`
      PRAGMA table_info(users)
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: "마이그레이션 완료",
        results,
        tableSchema: schema.results,
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
