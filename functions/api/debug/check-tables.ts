interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const studentId = url.searchParams.get('studentId');

  try {
    const results: any = {};

    // 1. User 테이블 스키마 확인
    try {
      const userSchema = await DB.prepare(`
        PRAGMA table_info(User)
      `).all();
      results.userSchema = userSchema.results;
    } catch (e: any) {
      results.userSchemaError = e.message;
    }

    // 2. Class 테이블 스키마
    try {
      const classSchema = await DB.prepare(`
        PRAGMA table_info(Class)
      `).all();
      results.classSchema = classSchema.results;
    } catch (e: any) {
      results.classSchemaError = e.message;
    }

    // 3. ClassStudent 테이블 스키마
    try {
      const csSchema = await DB.prepare(`
        PRAGMA table_info(ClassStudent)
      `).all();
      results.classStudentSchema = csSchema.results;
    } catch (e: any) {
      results.classStudentSchemaError = e.message;
    }

    // 4. 특정 학생 데이터 확인
    if (studentId) {
      try {
        const student = await DB.prepare(`
          SELECT * FROM User WHERE id = ?
        `).bind(studentId).first();
        results.studentData = student;
      } catch (e: any) {
        results.studentDataError = e.message;
      }

      // 5. 학생의 반 배정 확인
      try {
        const classes = await DB.prepare(`
          SELECT * FROM ClassStudent WHERE studentId = ?
        `).bind(studentId).all();
        results.studentClasses = classes.results;
      } catch (e: any) {
        results.studentClassesError = e.message;
      }

      // 6. JOIN 쿼리 테스트
      try {
        const joined = await DB.prepare(`
          SELECT 
            cs.id as csId,
            cs.studentId,
            cs.classId,
            c.id as classIdFromClass,
            c.name as className
          FROM ClassStudent cs
          LEFT JOIN Class c ON cs.classId = c.id
          WHERE cs.studentId = ?
        `).bind(studentId).all();
        results.joinedData = joined.results;
      } catch (e: any) {
        results.joinedDataError = e.message;
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
