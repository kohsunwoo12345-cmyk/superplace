/**
 * POST /api/admin/cleanup-codes
 * User 테이블에 없는 userId의 출석 코드 비활성화
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
    let deactivated = 0;

    // 1. 모든 활성 코드 조회
    const codes = await DB.prepare(`
      SELECT code, userId FROM student_attendance_codes WHERE isActive = 1
    `).all();

    logs.push(`📊 활성 코드 수: ${codes.results?.length || 0}`);

    // 2. 각 코드의 userId가 User 테이블에 존재하는지 확인
    for (const codeRecord of codes.results || []) {
      const { code, userId } = codeRecord as any;

      // User 테이블에서 학생 조회
      const user = await DB.prepare(`
        SELECT id FROM users WHERE id = ?
      `).bind(userId).first();

      if (!user) {
        // User 테이블에 없으면 비활성화
        await DB.prepare(`
          UPDATE student_attendance_codes SET isActive = 0 WHERE code = ?
        `).bind(code).run();
        
        logs.push(`❌ 비활성화: ${code} (userId: ${userId})`);
        deactivated++;
      }
    }

    // 3. 최종 활성 코드 수 확인
    const finalCodes = await DB.prepare(`
      SELECT COUNT(*) as count FROM student_attendance_codes WHERE isActive = 1
    `).first();

    return new Response(
      JSON.stringify({
        success: true,
        deactivated: deactivated,
        remainingActive: (finalCodes as any)?.count || 0,
        logs: logs,
        message: `${deactivated}개의 잘못된 코드를 비활성화했습니다.`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Cleanup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "정리 실패",
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
