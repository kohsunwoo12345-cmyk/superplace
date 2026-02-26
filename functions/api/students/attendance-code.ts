interface Env {
  DB: D1Database;
}

// 학생별 출석 코드 생성 또는 조회
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
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 출석 코드 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS student_attendance_codes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        academyId TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 기존 코드 확인
    const existing = await DB.prepare(`
      SELECT * FROM student_attendance_codes WHERE userId = ?
    `).bind(userId).first();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          code: existing.code,
          userId: existing.userId,
          isActive: existing.isActive,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 새로운 6자리 코드 생성 (중복 방지)
    let code = '';
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const duplicate = await DB.prepare(`
        SELECT id FROM student_attendance_codes WHERE code = ?
      `).bind(code).first();

      if (!duplicate) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: "Failed to generate unique code" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 코드 저장
    const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await DB.prepare(`
      INSERT INTO student_attendance_codes (id, userId, code, isActive)
      VALUES (?, ?, ?, 1)
    `).bind(codeId, userId, code).run();

    return new Response(
      JSON.stringify({
        success: true,
        code,
        userId,
        isActive: 1,
        isNew: true,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Get attendance code error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get attendance code",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
