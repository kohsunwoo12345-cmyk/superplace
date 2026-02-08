interface Env {
  DB: D1Database;
}

/**
 * 기존 학생들에게 출석 코드 생성 API
 * 
 * POST /api/admin/generate-student-codes
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Generating attendance codes for students...');

    // 1. attendance_code 컬럼이 있는지 확인
    const schema = await DB.prepare(`PRAGMA table_info(users)`).all();
    const hasAttendanceCode = schema.results.some((col: any) => col.name === 'attendance_code');

    if (!hasAttendanceCode) {
      return new Response(
        JSON.stringify({
          error: 'attendance_code column does not exist',
          message: 'Please add attendance_code column to users table first',
          instruction: 'Run: ALTER TABLE users ADD COLUMN attendance_code TEXT;'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. 코드가 없는 학생들 조회
    const students = await DB.prepare(`
      SELECT id, name, email FROM users 
      WHERE role = 'STUDENT' AND (attendance_code IS NULL OR attendance_code = '')
    `).all();

    console.log(`Found ${students.results.length} students without codes`);

    // 3. 각 학생에게 고유한 6자리 코드 생성
    const generated: any[] = [];
    const errors: any[] = [];

    for (const student of students.results) {
      try {
        // 중복되지 않는 코드 생성
        let code = '';
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
          code = Math.floor(100000 + Math.random() * 900000).toString();
          
          // 코드 중복 확인
          const existing = await DB.prepare(
            `SELECT id FROM users WHERE attendance_code = ?`
          ).bind(code).first();

          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          errors.push({
            studentId: student.id,
            name: student.name,
            error: 'Could not generate unique code after 10 attempts'
          });
          continue;
        }

        // 코드 저장
        await DB.prepare(`
          UPDATE users SET attendance_code = ? WHERE id = ?
        `).bind(code, student.id).run();

        generated.push({
          studentId: student.id,
          name: student.name,
          email: student.email,
          code: code
        });

        console.log(`✅ Generated code ${code} for student ${student.name}`);
      } catch (error: any) {
        errors.push({
          studentId: student.id,
          name: student.name,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${generated.length} attendance codes`,
        data: {
          generated,
          errors,
          total: students.results.length
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Code generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Code generation failed',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
