/**
 * GET /api/test/check-codes
 * 데이터베이스에 있는 출석 코드 확인 (테스트용)
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 모든 활성화된 출석 코드 조회
    const codes = await DB.prepare(`
      SELECT 
        c.code,
        c.userId,
        c.isActive,
        u.name,
        u.email,
        u.role
      FROM student_attendance_codes c
      LEFT JOIN User u ON c.userId = u.id
      WHERE c.isActive = 1
      ORDER BY c.createdAt DESC
      LIMIT 10
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        count: codes.results?.length || 0,
        codes: codes.results || [],
        message: "활성화된 출석 코드 목록 (최근 10개)"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Check codes error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "코드 조회 실패",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
