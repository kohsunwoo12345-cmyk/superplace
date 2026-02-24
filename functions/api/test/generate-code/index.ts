/**
 * POST /api/test/generate-code
 * 기존 학생에게 새로운 출석 코드 발급
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    // userId가 제공되지 않으면 첫 번째 학생 사용
    let targetUserId = userId;
    
    if (!targetUserId) {
      // 학생 역할을 가진 사용자 찾기
      const student = await DB.prepare(`
        SELECT id, name, email FROM User WHERE role = 'STUDENT' LIMIT 1
      `).first();

      if (!student) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "학생이 없습니다. 먼저 학생을 생성해주세요." 
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      targetUserId = student.id;
    }

    // 학생 정보 조회
    const student = await DB.prepare(`
      SELECT id, name, email, role FROM User WHERE id = ?
    `).bind(targetUserId).first();

    if (!student) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `학생 ID ${targetUserId}를 찾을 수 없습니다.` 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6자리 출석 코드 생성
    const attendanceCode = String(Math.floor(100000 + Math.random() * 900000));

    // student_attendance_codes 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS student_attendance_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `).run();

    // 기존 코드 비활성화
    await DB.prepare(`
      UPDATE student_attendance_codes 
      SET isActive = 0 
      WHERE userId = ?
    `).bind(targetUserId).run();

    // 새 코드 생성
    await DB.prepare(`
      INSERT INTO student_attendance_codes (userId, code, isActive)
      VALUES (?, ?, 1)
    `).bind(targetUserId, attendanceCode).run();

    console.log('✅ Attendance code generated:', {
      userId: targetUserId,
      name: student.name,
      code: attendanceCode
    });

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role
        },
        attendanceCode: attendanceCode,
        instructions: {
          step1: "https://superplacestudy.pages.dev/attendance-verify 페이지로 이동",
          step2: `출석 코드 ${attendanceCode} 입력`,
          step3: "숙제 제출 페이지로 전환 확인"
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Code generation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "코드 생성 실패",
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
