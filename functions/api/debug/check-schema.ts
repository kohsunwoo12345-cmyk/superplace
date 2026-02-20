// 실제 프로덕션 DB 스키마 확인용 API
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return Response.json({ error: "DB not configured" }, { status: 500 });
    }

    // 1. 모든 테이블 목록 조회
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();

    // 2. users 테이블 스키마 확인 (소문자)
    let usersSchemaLower = null;
    try {
      usersSchemaLower = await DB.prepare(`
        PRAGMA table_info(users)
      `).all();
    } catch (e: any) {
      usersSchemaLower = { error: e.message };
    }

    // 3. User 테이블 스키마 확인 (대문자)
    let usersSchemaUpper = null;
    try {
      usersSchemaUpper = await DB.prepare(`
        PRAGMA table_info(User)
      `).all();
    } catch (e: any) {
      usersSchemaUpper = { error: e.message };
    }

    // 4. students 테이블 스키마 확인
    let studentsSchema = null;
    try {
      studentsSchema = await DB.prepare(`
        PRAGMA table_info(students)
      `).all();
    } catch (e: any) {
      studentsSchema = { error: e.message };
    }

    // 5. academy 테이블 스키마 확인
    let academySchema = null;
    try {
      academySchema = await DB.prepare(`
        PRAGMA table_info(academy)
      `).all();
    } catch (e: any) {
      academySchema = { error: e.message };
    }

    // 6. Academy 테이블 스키마 확인 (대문자)
    let academySchemaUpper = null;
    try {
      academySchemaUpper = await DB.prepare(`
        PRAGMA table_info(Academy)
      `).all();
    } catch (e: any) {
      academySchemaUpper = { error: e.message };
    }

    // 7. 실제 users 데이터 샘플 (소문자 테이블)
    let usersSample = null;
    try {
      usersSample = await DB.prepare(`
        SELECT id, name, email, role, * 
        FROM users 
        LIMIT 3
      `).all();
    } catch (e: any) {
      usersSample = { error: e.message };
    }

    // 8. 실제 User 데이터 샘플 (대문자 테이블)
    let userSampleUpper = null;
    try {
      userSampleUpper = await DB.prepare(`
        SELECT id, name, email, role, * 
        FROM User 
        LIMIT 3
      `).all();
    } catch (e: any) {
      userSampleUpper = { error: e.message };
    }

    // 9. 학생 역할 카운트 (소문자)
    let studentCountLower = null;
    try {
      studentCountLower = await DB.prepare(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE role = 'STUDENT'
      `).first();
    } catch (e: any) {
      studentCountLower = { error: e.message };
    }

    // 10. 학생 역할 카운트 (대문자)
    let studentCountUpper = null;
    try {
      studentCountUpper = await DB.prepare(`
        SELECT COUNT(*) as count 
        FROM User 
        WHERE role = 'STUDENT'
      `).first();
    } catch (e: any) {
      studentCountUpper = { error: e.message };
    }

    return Response.json({
      success: true,
      tables: tables.results.map((t: any) => t.name),
      schemas: {
        users_lowercase: usersSchemaLower,
        User_uppercase: usersSchemaUpper,
        students: studentsSchema,
        academy_lowercase: academySchema,
        Academy_uppercase: academySchemaUpper,
      },
      samples: {
        users_lowercase: usersSample,
        User_uppercase: userSampleUpper,
      },
      counts: {
        students_from_users_table: studentCountLower,
        students_from_User_table: studentCountUpper,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Schema check error:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
};
