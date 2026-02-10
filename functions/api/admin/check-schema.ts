interface Env {
  DB: D1Database;
}

/**
 * GET /api/admin/check-schema
 * D1 데이터베이스 스키마 확인
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

    // 1. 모든 테이블 목록
    const tablesResult = await DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all();

    // 2. classes 테이블 구조 확인
    let classesSchema = null;
    try {
      const schemaResult = await DB.prepare(`PRAGMA table_info(classes)`).all();
      classesSchema = schemaResult.results;
    } catch (e: any) {
      classesSchema = { error: e.message };
    }

    // 3. users 테이블 구조 확인
    let usersSchema = null;
    try {
      const schemaResult = await DB.prepare(`PRAGMA table_info(users)`).all();
      usersSchema = schemaResult.results;
    } catch (e: any) {
      usersSchema = { error: e.message };
    }

    // 4. class_schedules 테이블 확인
    let schedulesSchema = null;
    try {
      const schemaResult = await DB.prepare(`PRAGMA table_info(class_schedules)`).all();
      schedulesSchema = schemaResult.results;
    } catch (e: any) {
      schedulesSchema = { error: e.message };
    }

    // 5. class_students 테이블 확인
    let classStudentsSchema = null;
    try {
      const schemaResult = await DB.prepare(`PRAGMA table_info(class_students)`).all();
      classStudentsSchema = schemaResult.results;
    } catch (e: any) {
      classStudentsSchema = { error: e.message };
    }

    // 6. students 테이블 확인
    let studentsSchema = null;
    try {
      const schemaResult = await DB.prepare(`PRAGMA table_info(students)`).all();
      studentsSchema = schemaResult.results;
    } catch (e: any) {
      studentsSchema = { error: e.message };
    }

    return new Response(
      JSON.stringify({
        success: true,
        tables: tablesResult.results?.map((t: any) => t.name) || [],
        schemas: {
          classes: classesSchema,
          users: usersSchema,
          students: studentsSchema,
          class_schedules: schedulesSchema,
          class_students: classStudentsSchema
        }
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Check schema error:", error);
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
