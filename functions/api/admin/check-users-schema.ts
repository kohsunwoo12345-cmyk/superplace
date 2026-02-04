interface Env {
  DB: D1Database;
}

/**
 * users 테이블 스키마 확인
 * GET /api/admin/check-users-schema
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
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

    // users 테이블 스키마 확인
    const schemaResult = await DB.prepare(`
      PRAGMA table_info(users)
    `).all();

    // users 테이블 샘플 데이터 (첫 5개)
    const sampleData = await DB.prepare(`
      SELECT * FROM users LIMIT 5
    `).all();

    return new Response(
      JSON.stringify({
        tableName: "users",
        schema: schemaResult.results,
        sampleData: sampleData.results,
        columnNames: schemaResult.results?.map((col: any) => col.name) || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Check users schema error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check users schema",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
