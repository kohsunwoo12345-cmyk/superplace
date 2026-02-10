interface Env {
  DB: D1Database;
}

/**
 * GET /api/notifications?userId={userId}
 * 모든 사용자의 알림 조회 (notifications 테이블만 사용)
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
    const academyId = url.searchParams.get("academyId");
    
    console.log('🔔 Fetching notifications:', { userId, academyId });

    // notifications 테이블에서 사용자별 알림 조회
    let query = `
      SELECT 
        id,
        title,
        message,
        type,
        timestamp,
        userId,
        read
      FROM notifications
    `;
    
    const bindings: any[] = [];
    
    // userId 필터링
    if (userId) {
      query += ` WHERE userId = ?`;
      bindings.push(parseInt(userId));
    }
    
    query += ` ORDER BY timestamp DESC LIMIT 50`;

    const result = userId 
      ? await DB.prepare(query).bind(...bindings).all()
      : await DB.prepare(query).all();
    const dbNotifications = result.results || [];

    // 프론트엔드 형식으로 변환
    const notifications = dbNotifications.map((n: any) => ({
      id: n.id,
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      timestamp: new Date(n.timestamp),
      read: n.read === 1, // DB의 read 값 사용
      priority: 'medium', // 기본값
      userId: n.userId, // userId 포함
    }));

    console.log('✅ Found notifications:', notifications.length);

    // 읽지 않은 알림 개수 계산
    const unreadCount = notifications.filter(n => !n.read).length;

    return new Response(
      JSON.stringify({
        success: true,
        notifications: notifications,
        unreadCount: unreadCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Fetch notifications error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "알림 조회 중 오류가 발생했습니다",
        notifications: [],
        unreadCount: 0,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
