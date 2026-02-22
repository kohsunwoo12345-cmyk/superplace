interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/test-schema
 * 테스트용 - 실제 DB 스키마 확인
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

    // 1. users 테이블 스키마 확인
    const usersSchema = await DB.prepare(`
      PRAGMA table_info(users)
    `).all();

    // 2. students 테이블 스키마 확인
    const studentsSchema = await DB.prepare(`
      PRAGMA table_info(students)
    `).all();

    // 3. 실제 users 데이터 샘플 (role이 STUDENT인 것만)
    const sampleUsers = await DB.prepare(`
      SELECT * FROM users WHERE role = 'STUDENT' LIMIT 3
    `).all();

    // 4. 실제 students 데이터 샘플
    const sampleStudents = await DB.prepare(`
      SELECT * FROM students LIMIT 3
    `).all();

    // 5. JOIN 테스트
    const joinTest = await DB.prepare(`
      SELECT 
        u.id as userId,
        u.name,
        u.email,
        u.academyId as userAcademyId,
        s.id as studentId,
        s.academyId as studentAcademyId,
        s.grade
      FROM users u
      LEFT JOIN students s ON u.id = s.userId
      WHERE u.role = 'STUDENT'
      LIMIT 3
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        schemas: {
          users: usersSchema.results,
          students: studentsSchema.results
        },
        samples: {
          users: sampleUsers.results,
          students: sampleStudents.results,
          joinTest: joinTest.results
        },
        counts: {
          users: sampleUsers.results?.length || 0,
          students: sampleStudents.results?.length || 0,
          joined: joinTest.results?.length || 0
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Test schema error:", error);
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
