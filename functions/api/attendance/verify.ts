interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json() as any;
    const { userId, code } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId || !code) {
      return new Response(
        JSON.stringify({ error: "userId and code are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 출석 기록 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        code TEXT NOT NULL,
        verifiedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'VERIFIED'
      )
    `).run();

    // 코드 유효성 확인
    const codeRecord = await DB.prepare(`
      SELECT * FROM student_attendance_codes WHERE code = ? AND isActive = 1
    `).bind(code).first();

    if (!codeRecord) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "유효하지 않은 출석 코드입니다." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 오늘 이미 출석했는지 확인
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await DB.prepare(`
      SELECT * FROM attendance_records 
      WHERE userId = ? 
      AND date(verifiedAt) = date(?)
    `).bind(userId, today).first();

    if (existingRecord) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "오늘 이미 출석하셨습니다." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 출석 기록 저장
    const recordId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await DB.prepare(`
      INSERT INTO attendance_records (id, userId, code, status)
      VALUES (?, ?, ?, 'VERIFIED')
    `).bind(recordId, userId, code).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "출석이 인증되었습니다.",
        recordId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Attendance verify error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to verify attendance",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
