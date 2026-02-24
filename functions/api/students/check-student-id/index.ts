/**
 * GET /api/students/check-student-id?studentId=157
 * 학생 ID 확인 및 숙제 데이터 존재 여부 확인
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. 학생 정보 확인
    const student = await DB.prepare(`
      SELECT id, email, name, role FROM users WHERE id = ?
    `).bind(parseInt(studentId)).first();

    // 2. 숙제 제출 통계
    const homeworkStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN score IS NOT NULL THEN 1 ELSE 0 END) as graded,
        AVG(score) as avgScore
      FROM homework_submissions
      WHERE userId = ?
    `).bind(parseInt(studentId)).first();

    // 3. 최근 숙제 5개
    const recentHomework = await DB.prepare(`
      SELECT 
        id,
        subject,
        score,
        submittedAt,
        gradedAt
      FROM homework_submissions
      WHERE userId = ?
      ORDER BY submittedAt DESC
      LIMIT 5
    `).bind(parseInt(studentId)).all();

    // 4. 채팅 메시지 통계
    let chatStats = { total: 0 };
    try {
      chatStats = await DB.prepare(`
        SELECT COUNT(*) as total
        FROM chat_messages
        WHERE student_id = ?
      `).bind(parseInt(studentId)).first() as any;
    } catch (e) {
      // chat_messages 테이블이 없을 수 있음
      chatStats = { total: 0 };
    }

    return new Response(
      JSON.stringify({
        success: true,
        student: student,
        homework: {
          stats: homeworkStats,
          recent: recentHomework.results
        },
        chat: chatStats
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Student check failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
