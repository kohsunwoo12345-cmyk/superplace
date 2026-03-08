// Cloudflare Pages Function - List all tables in database
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const db = context.env.DB;
    
    // Get all tables
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        tables: tables.results || [],
        count: tables.results?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("테이블 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "테이블 목록 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
