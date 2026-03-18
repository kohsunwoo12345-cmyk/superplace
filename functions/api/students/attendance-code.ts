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

    // 출석 코드 테이블은 이미 생성되어 있음 (userId는 INTEGER)
    // CREATE TABLE 호출 제거 - 스키마 충돌 방지

    // userId를 INTEGER로 변환
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return new Response(JSON.stringify({ error: "Invalid userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 기존 코드 확인 (userId는 INTEGER)
    const existing = await DB.prepare(`
      SELECT * FROM student_attendance_codes WHERE userId = ?
    `).bind(userIdInt).first();

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

    // 코드 저장 (userId는 INTEGER)
    const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await DB.prepare(`
      INSERT INTO student_attendance_codes (id, userId, code, isActive)
      VALUES (?, ?, ?, 1)
    `).bind(codeId, userIdInt, code).run();

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
