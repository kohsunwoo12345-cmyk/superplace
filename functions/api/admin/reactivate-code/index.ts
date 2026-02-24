/**
 * POST /api/admin/reactivate-code
 * 특정 출석 코드를 다시 활성화
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
    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔄 Reactivating code:', code);

    // 코드 활성화
    const result = await DB.prepare(`
      UPDATE student_attendance_codes SET isActive = 1 WHERE code = ?
    `).bind(code).run();

    console.log('✅ Code reactivated:', code, 'Changes:', result.meta.changes);

    return new Response(
      JSON.stringify({
        success: true,
        message: `출석 코드 ${code}가 활성화되었습니다`,
        changes: result.meta.changes
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Reactivate error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "코드 활성화 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
