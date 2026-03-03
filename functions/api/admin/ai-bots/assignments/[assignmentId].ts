interface Env {
  DB: D1Database;
}

/**
 * DELETE /api/admin/ai-bots/assignments/[assignmentId]
 * AI 봇 할당 취소 (구독 슬롯 복원)
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
      console.error('❌ Invalid assignment ID:', assignmentId);
      return new Response(
        JSON.stringify({ success: false, error: "할당 ID가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🗑️ AI 봇 할당 취소 요청:", assignmentId);

    // 할당 정보 조회 (슬롯 복구를 위해)
    const assignment = await DB.prepare(`
      SELECT 
        id, 
        botId, 
        botName, 
        userId, 
        userName, 
        userEmail, 
        userAcademyId, 
        status,
        startDate,
        endDate
      FROM ai_bot_assignments 
      WHERE id = ?
    `).bind(assignmentId).first() as any;

    if (!assignment) {
      console.error('❌ Assignment not found:', assignmentId);
      return new Response(
        JSON.stringify({ success: false, error: "할당을 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📋 Assignment details:', {
      id: assignment.id,
      botId: assignment.botId,
      botName: assignment.botName,
      userId: assignment.userId,
      userName: assignment.userName,
      academyId: assignment.userAcademyId,
      status: assignment.status
    });

    // 할당 삭제
    await DB.prepare(`
      DELETE FROM ai_bot_assignments
      WHERE id = ?
    `).bind(assignmentId).run();

    console.log('✅ Assignment deleted from database');

    // 🔓 구독 슬롯 복구 (학원 할당인 경우)
    if (assignment.userAcademyId && assignment.botId) {
      console.log('📈 Restoring subscription slot for academy:', assignment.userAcademyId);
      
      // 복원 전 슬롯 상태 조회
      const beforeRestore = await DB.prepare(`
        SELECT totalStudentSlots, usedStudentSlots, remainingStudentSlots
        FROM AcademyBotSubscription
        WHERE academyId = ? AND productId = ?
      `).bind(assignment.userAcademyId, assignment.botId).first() as any;

      if (beforeRestore) {
        console.log('📊 Slots before restore:', {
          total: beforeRestore.totalStudentSlots,
          used: beforeRestore.usedStudentSlots,
          remaining: beforeRestore.remainingStudentSlots
        });
      }

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

      // 복원 후 슬롯 상태 조회
      const afterRestore = await DB.prepare(`
        SELECT totalStudentSlots, usedStudentSlots, remainingStudentSlots
        FROM AcademyBotSubscription
        WHERE academyId = ? AND productId = ?
      `).bind(assignment.userAcademyId, assignment.botId).first() as any;

      if (afterRestore) {
        console.log('📊 Slots after restore:', {
          total: afterRestore.totalStudentSlots,
          used: afterRestore.usedStudentSlots,
          remaining: afterRestore.remainingStudentSlots
        });
      }

      console.log('✅ Subscription slot restored successfully');
    } else {
      console.log('ℹ️ No academy subscription to restore (admin direct assignment or no academyId)');
    }

    console.log("✅ 할당 취소 완료");

    return new Response(
      JSON.stringify({
        success: true,
        message: "할당이 취소되었습니다. 구독 슬롯이 복원되어 다른 학생에게 재할당할 수 있습니다.",
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
