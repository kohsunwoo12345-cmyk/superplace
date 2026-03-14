/**
 * POST /api/admin/fix-attendance-codes
 * 잘못된 출석 코드 정리 및 수정
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const logs: string[] = [];
    let fixed = 0;
    let deactivated = 0;

    // 1. 모든 활성 코드 조회
    const codes = await DB.prepare(`
      SELECT code, userId, isActive FROM student_attendance_codes WHERE isActive = 1
    `).all();

    logs.push(`✅ Found ${codes.results?.length || 0} active codes`);

    // 2. 각 코드의 userId가 User 테이블에 존재하는지 확인
    for (const codeRecord of codes.results || []) {
      const { code, userId } = codeRecord as any;

      // User 테이블에서 학생 조회
      const user = await DB.prepare(`
        SELECT id, name, email, role FROM users WHERE id = ?
      `).bind(userId).first();

      if (!user) {
        // User 테이블에 없으면 비활성화
        await DB.prepare(`
          UPDATE student_attendance_codes SET isActive = 0 WHERE code = ?
        `).bind(code).run();
        
        logs.push(`❌ 비활성화: 코드 ${code} (userId: ${userId}) - User 테이블에 없음`);
        deactivated++;
      } else {
        logs.push(`✅ 정상: 코드 ${code} - ${user.name} (${user.email})`);
        fixed++;
      }
    }

    // 3. 학생 역할을 가진 모든 사용자에게 코드가 있는지 확인
    const students = await DB.prepare(`
      SELECT id, name, email FROM users WHERE role = 'STUDENT'
    `).all();

    logs.push(`\n📊 Student 역할 사용자: ${students.results?.length || 0}명`);

    for (const student of students.results || []) {
      const { id: studentId, name, email } = student as any;

      // 이 학생의 활성 코드가 있는지 확인
      const existingCode = await DB.prepare(`
        SELECT code FROM student_attendance_codes 
        WHERE userId = ? AND isActive = 1
      `).bind(studentId).first();

      if (!existingCode) {
        // 코드가 없으면 새로 생성
        const newCode = String(Math.floor(100000 + Math.random() * 900000));
        
        await DB.prepare(`
          INSERT INTO student_attendance_codes (userId, code, isActive)
          VALUES (?, ?, 1)
        `).bind(studentId, newCode).run();

        logs.push(`🆕 새 코드 생성: ${newCode} - ${name} (${email})`);
        fixed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalChecked: codes.results?.length || 0,
          validCodes: fixed,
          deactivated: deactivated,
          totalStudents: students.results?.length || 0
        },
        logs: logs,
        message: "출석 코드 정리 완료"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Fix codes error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "코드 수정 실패",
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
