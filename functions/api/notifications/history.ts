interface Env {
  DB: D1Database;
}

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
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Get recent notifications (only fetch existing columns)
    const result = await DB.prepare(`
      SELECT 
        id,
        title,
        message,
        type,
        timestamp
      FROM notifications
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(limit).all();

    const notifications = (result.results || []).map((notif: any) => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      filterType: 'all', // 기본값
      recipients: 0, // 기본값
      sentAt: notif.timestamp,
      status: "전송 완료",
    }));

    return new Response(
      JSON.stringify({
        success: true,
        notifications,
        total: notifications.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Notification history error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "알림 히스토리 조회 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
