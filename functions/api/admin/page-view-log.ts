interface Env {
  DB: D1Database;
}

function getKoreanTime(): string {
  const now = new Date();
  const offset = 9 * 60; // KST is UTC+9
  const kstTime = new Date(now.getTime() + offset * 60 * 1000);
  return kstTime.toISOString().replace('T', ' ').substring(0, 19);
}

// 페이지 조회 로그 기록
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as {
      user_email: string;
      user_id?: string;
      page_path: string;
      page_title: string;
      action: string;
      details?: string;
    };

    const { user_email, user_id, page_path, page_title, action, details } = body;

    if (!user_email || !page_path || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_email, page_path, action" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get client IP
    const clientIP = context.request.headers.get('CF-Connecting-IP') || 
                     context.request.headers.get('X-Forwarded-For') || 
                     'unknown';

    const timestamp = getKoreanTime();

    // Create table if not exists
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS page_view_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_id TEXT,
        page_path TEXT NOT NULL,
        page_title TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Insert log
    const result = await DB.prepare(`
      INSERT INTO page_view_logs (
        timestamp, user_email, user_id, page_path, page_title, action, details, ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      timestamp,
      user_email,
      user_id || null,
      page_path,
      page_title,
      action,
      details || '',
      clientIP
    ).run();

    console.log(`📝 페이지 조회 로그 기록: ${user_email} - ${page_title} (${action})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "페이지 조회 로그가 기록되었습니다",
        logId: result.meta.last_row_id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to log page view:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to log page view",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
