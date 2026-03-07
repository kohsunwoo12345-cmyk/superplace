interface Env {
  DB: D1Database;
}

/**
 * DB 스키마 확인 API
 * GET /api/admin/check-schema?table=homework_submissions
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const tableName = url.searchParams.get("table") || "homework_submissions";

    console.log(`🔍 Checking schema for table: ${tableName}`);

    // PRAGMA table_info를 사용해서 테이블 스키마 조회
    const schema = await DB.prepare(`
      PRAGMA table_info(${tableName})
    `).all();

    console.log(`✅ Schema for ${tableName}:`, schema);

    return new Response(
      JSON.stringify({
        success: true,
        table: tableName,
        columns: schema.results,
        columnNames: schema.results?.map((col: any) => col.name),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Check schema error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to check schema",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
