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

// POST: 학생 출석 코드 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { userId, academyId, classId, expiresInHours } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성
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

    // 기존 활성 코드 비활성화
    await DB.prepare(
      "UPDATE student_attendance_codes SET isActive = 0 WHERE userId = ? AND isActive = 1"
    ).bind(userId).run();

    // 고유 코드 생성 (중복 체크)
    let code = generateAttendanceCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await DB.prepare(
        "SELECT id FROM student_attendance_codes WHERE code = ?"
      ).bind(code).first();
      
      if (!existing) break;
      code = generateAttendanceCode();
      attempts++;
    }

    if (attempts === 10) {
      return new Response(
        JSON.stringify({ error: "Failed to generate unique code" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 만료 시간 계산
    let expiresAt = null;
    if (expiresInHours) {
      const now = new Date();
      now.setHours(now.getHours() + expiresInHours);
      expiresAt = now.toISOString();
    }

    const id = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 새 코드 생성
    await DB.prepare(`
      INSERT INTO student_attendance_codes (id, userId, code, academyId, classId, isActive, expiresAt)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).bind(id, userId, code, academyId || null, classId || null, expiresAt).run();

    return new Response(
      JSON.stringify({
        success: true,
        id,
        code,
        userId,
        academyId,
        classId,
        expiresAt,
        createdAt: new Date().toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Generate attendance code error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate attendance code",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// GET: 학생의 활성 코드 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const code = await DB.prepare(
      `SELECT * FROM student_attendance_codes 
       WHERE userId = ? AND isActive = 1 
       ORDER BY createdAt DESC LIMIT 1`
    ).bind(userId).first();

    return new Response(
      JSON.stringify({ code }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get attendance code error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get attendance code",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
