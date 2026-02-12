interface Env {
  DB: D1Database;
}

/**
 * DELETE /api/admin/ai-bots/assignments/[assignmentId]
 * AI 봇 할당 취소
 */
export const onRequestDelete = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // URL에서 assignmentId 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const assignmentId = pathParts[pathParts.length - 1];

    if (!assignmentId || assignmentId === 'assignments') {
      return new Response(
        JSON.stringify({ success: false, error: "할당 ID가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("❌ AI 봇 할당 취소:", assignmentId);

    // 할당 삭제
    await DB.prepare(`
      DELETE FROM ai_bot_assignments
      WHERE id = ?
    `).bind(assignmentId).run();

    console.log("✅ 할당 취소 완료");

    return new Response(
      JSON.stringify({
        success: true,
        message: "할당이 취소되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ 할당 취소 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "할당 취소 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
