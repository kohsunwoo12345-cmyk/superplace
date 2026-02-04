interface Env {
  DB: D1Database;
}

// 문의 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 문의 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userName TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        response TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 모든 문의 조회
    const inquiriesResult = await DB.prepare(
      `SELECT * FROM inquiries ORDER BY 
       CASE status 
         WHEN 'PENDING' THEN 1 
         WHEN 'IN_PROGRESS' THEN 2 
         WHEN 'RESOLVED' THEN 3 
       END, 
       datetime(createdAt) DESC`
    ).all();

    const inquiries = inquiriesResult?.results || [];

    return new Response(JSON.stringify({ inquiries }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Inquiries list error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch inquiries",
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
