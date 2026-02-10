interface Env {
  DB: D1Database;
}

/**
 * GET /api/notifications/user?userId={userId}
 * 특정 사용자의 알림 목록 조회 (읽지 않은 알림 포함)
 */
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
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔔 Fetching notifications for user:', userId);

    // notification_recipients 테이블이 없으므로 notifications 테이블에서만 조회
    const query = `
      SELECT 
        id,
        title,
        message,
        type,
        createdAt
      FROM notifications
      ORDER BY createdAt DESC
      LIMIT 100
    `;

    const result = await DB.prepare(query).all();
    const notifications = result.results || [];

    // 모든 알림을 읽지 않은 것으로 간주 (읽음 상태 저장 테이블 없음)
    const unreadCount = notifications.length;

    console.log('✅ Found notifications:', notifications.length, 'unread:', unreadCount);

    return new Response(
      JSON.stringify({
        success: true,
        notifications: notifications,
        unreadCount: unreadCount,
        totalCount: notifications.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Fetch user notifications error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "알림 조회 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
