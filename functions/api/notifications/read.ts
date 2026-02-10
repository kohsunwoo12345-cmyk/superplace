interface Env {
  DB: D1Database;
}

/**
 * POST /api/notifications/read
 * 알림을 읽음 상태로 업데이트
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
    const { notificationId, userId, markAll } = body;

    console.log('📖 Mark as read request:', { notificationId, userId, markAll });

    if (markAll && userId) {
      // 특정 사용자의 모든 알림을 읽음 처리
      const updateResult = await DB.prepare(`
        UPDATE notifications
        SET read = 1
        WHERE userId = ?
      `).bind(userId).run();
      
      console.log('✅ Marked all notifications as read for user:', userId);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "모든 알림을 읽음 처리했습니다",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else if (notificationId) {
      // 특정 알림을 읽음 처리
      const updateResult = await DB.prepare(`
        UPDATE notifications
        SET read = 1
        WHERE id = ? AND userId = ?
      `).bind(notificationId, userId).run();
      
      console.log('✅ Marked notification as read:', notificationId);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "알림을 읽음 처리했습니다",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "notificationId 또는 markAll이 필요합니다",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("❌ Mark notification as read error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "알림 읽음 처리 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
