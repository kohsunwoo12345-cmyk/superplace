/**
 * GET /api/test/check-all-codes
 * 모든 활성 출석 코드 확인 (제한 없음)
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
    `).all();

    const validCodes = [];
    const invalidCodes = [];

    for (const code of codes.results || []) {
      if ((code as any).name && (code as any).email) {
        validCodes.push(code);
      } else {
        invalidCodes.push(code);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: codes.results?.length || 0,
        validCount: validCodes.length,
        invalidCount: invalidCodes.length,
        validCodes: validCodes.slice(0, 20), // 처음 20개만
        invalidCodes: invalidCodes.slice(0, 20), // 처음 20개만
        message: `활성 코드: ${codes.results?.length || 0}개 (정상: ${validCodes.length}, 문제: ${invalidCodes.length})`
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
