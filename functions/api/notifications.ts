interface Env {
  DB: D1Database;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: number;
  priority: string;
  academyId: number;
  userId: number;
}

// 한국 시간 (KST) 생성 함수
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstTime.toISOString().replace('Z', '+09:00');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");
    const userId = url.searchParams.get("userId");

    // 학원별 알림 테이블이 없으면 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        academyId INTEGER,
        userId INTEGER,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    let query = `
      SELECT id, type, title, message, timestamp, read, priority, academyId, userId
      FROM notifications
      WHERE 1=1
    `;
    const params: any[] = [];

    // 학원별 필터링 (중요: 관리자가 아닌 경우 반드시 academyId로 필터링)
    if (academyId && academyId !== 'null' && academyId !== 'undefined') {
      query += ` AND academyId = ?`;
      params.push(parseInt(academyId));
    }

    // 사용자별 필터링 (선택적)
    if (userId) {
      query += ` AND (userId = ? OR userId IS NULL)`;
      params.push(parseInt(userId));
    }

    query += ` ORDER BY timestamp DESC LIMIT 50`;

    const result = await DB.prepare(query).bind(...params).all();

    const notifications = (result.results || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      timestamp: new Date(row.timestamp),
      read: row.read === 1,
      priority: row.priority,
      academyId: row.academyId,
      userId: row.userId,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        notifications,
        count: notifications.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch notifications",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// 알림 생성 엔드포인트
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body: any = await context.request.json();
    const { type, title, message, priority = "medium", academyId, userId } = body;

    if (!type || !title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const koreanTime = getKoreanTime();

    await DB.prepare(
      `INSERT INTO notifications (id, type, title, message, timestamp, priority, academyId, userId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        notificationId,
        type,
        title,
        message,
        koreanTime,
        priority,
        academyId || null,
        userId || null,
        koreanTime
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        notificationId,
        message: "Notification created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to create notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create notification",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
