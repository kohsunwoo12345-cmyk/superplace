interface Env {
  DB: D1Database;
}

/**
 * GET /api/debug/schema
 * DB 스키마 확인용
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Checking database schema...');

    // users 테이블 구조 확인
    const usersSchema = await DB.prepare(`
      PRAGMA table_info(users)
    `).all();

    // students 테이블 구조 확인
    const studentsSchema = await DB.prepare(`
      PRAGMA table_info(students)
    `).all();

    // 테이블 목록 확인
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all();

    console.log('✅ Schema fetched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        tables: tables.results,
        usersSchema: usersSchema.results,
        studentsSchema: studentsSchema.results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Schema check error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
