interface Env {
  DB: D1Database;
}

// 6자리 숫자 코드 생성
function generateAttendanceCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// POST: 사용자 추가 시 자동으로 출석 코드 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { name, email, password, role, phone, academyId } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일 중복 체크
    const existing = await DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // 사용자 생성
    const userRole = role || 'STUDENT';
    const result = await DB.prepare(
      `INSERT INTO users (name, email, password, role, phone, academy_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(name, email, password, userRole, phone || null, academyId || null).run();

    const userId = result.meta.last_row_id;

    // 학생인 경우 자동으로 출석 코드 생성
    let attendanceCode = null;
    if (userRole.toUpperCase() === 'STUDENT') {
      try {
        // 출석 코드 테이블 생성
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS student_attendance_codes (
            id TEXT PRIMARY KEY,
            userId INTEGER NOT NULL,
            code TEXT UNIQUE NOT NULL,
            academyId INTEGER,
            classId TEXT,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT (datetime('now')),
            expiresAt TEXT
          )
        `).run();

        // 6자리 숫자 코드 생성 (중복 체크)
        let code = generateAttendanceCode();
        let attempts = 0;
        while (attempts < 20) {
          const existing = await DB.prepare(
            "SELECT id FROM student_attendance_codes WHERE code = ?"
          ).bind(code).first();
          
          if (!existing) break;
          code = generateAttendanceCode();
          attempts++;
        }

        // 출석 코드 저장
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await DB.prepare(`
          INSERT INTO student_attendance_codes (id, userId, code, academyId, isActive)
          VALUES (?, ?, ?, ?, 1)
        `).bind(codeId, userId, code, academyId || null).run();

        attendanceCode = code;
      } catch (codeError) {
        console.error('Failed to generate attendance code:', codeError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: userRole.toUpperCase() === 'STUDENT' ? 
          `학생이 추가되었습니다. 출석 코드: ${attendanceCode}` : 
          '사용자가 추가되었습니다',
        user: {
          id: userId,
          name,
          email,
          role: userRole,
          phone,
          academyId
        },
        attendanceCode
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("User creation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create user",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
