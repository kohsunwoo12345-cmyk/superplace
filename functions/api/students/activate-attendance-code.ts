interface Env {
  DB: D1Database;
}

/**
 * POST /api/students/activate-attendance-code
 * 출석 코드 활성화/비활성화
 */
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
    const { userId, isActive } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const activeStatus = isActive ? 1 : 0;

    console.log('🔄 Updating attendance code status:', { userId, isActive: activeStatus });

    // 출석 코드 활성화 상태 업데이트
    await DB.prepare(`
      UPDATE student_attendance_codes
      SET isActive = ?
      WHERE userId = ?
    `).bind(activeStatus, userId).run();

    console.log('✅ Attendance code status updated');

    return new Response(
      JSON.stringify({
        success: true,
        message: isActive ? "출석 코드가 활성화되었습니다" : "출석 코드가 비활성화되었습니다",
        isActive: activeStatus,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Activate attendance code error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "출석 코드 활성화 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
