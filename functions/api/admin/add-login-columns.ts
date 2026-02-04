interface Env {
  DB: D1Database;
}

// users 테이블에 lastLoginAt, lastLoginIp 컬럼 추가
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const migrations = [];

    // lastLoginAt 컬럼 추가
    try {
      await DB.prepare(
        "ALTER TABLE users ADD COLUMN lastLoginAt TEXT"
      ).run();
      migrations.push("Added lastLoginAt column");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        migrations.push("lastLoginAt column already exists");
      } else {
        migrations.push(`lastLoginAt error: ${e.message}`);
      }
    }

    // lastLoginIp 컬럼 추가
    try {
      await DB.prepare(
        "ALTER TABLE users ADD COLUMN lastLoginIp TEXT"
      ).run();
      migrations.push("Added lastLoginIp column");
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        migrations.push("lastLoginIp column already exists");
      } else {
        migrations.push(`lastLoginIp error: ${e.message}`);
      }
    }

    // 현재 스키마 확인
    const schema = await DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
    ).first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Migration completed",
        migrations,
        currentSchema: schema?.sql
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
        error: "Failed to migrate",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
