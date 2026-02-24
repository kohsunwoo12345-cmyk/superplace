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

    // 할당 정보 조회 (슬롯 복구를 위해)
    const assignment = await DB.prepare(`
      SELECT * FROM ai_bot_assignments WHERE id = ?
    `).bind(assignmentId).first() as any;

    if (!assignment) {
      return new Response(
        JSON.stringify({ success: false, error: "할당을 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 할당 삭제
    await DB.prepare(`
      DELETE FROM ai_bot_assignments
      WHERE id = ?
    `).bind(assignmentId).run();

    // 🔓 구독 슬롯 복구 (학원 할당인 경우)
    if (assignment.userAcademyId && assignment.botId) {
      console.log('📈 Restoring subscription slot for academy:', assignment.userAcademyId);
      
      await DB.prepare(`
        UPDATE AcademyBotSubscription
        SET usedStudentSlots = CASE 
              WHEN usedStudentSlots > 0 THEN usedStudentSlots - 1 
              ELSE 0 
            END,
            remainingStudentSlots = remainingStudentSlots + 1,
            updatedAt = datetime('now')
        WHERE academyId = ? AND productId = ?
      `).bind(assignment.userAcademyId, assignment.botId).run();

      console.log('✅ Subscription slot restored');
    }

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
