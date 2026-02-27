// Cloudflare Pages Function - DB Schema Debug
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const db = context.env.DB;
    
    // 1. 모든 테이블 목록
    const tables = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all();
    
    // 2. landing_pages 테이블 구조
    const landingPagesSchema = await db
      .prepare("PRAGMA table_info(landing_pages)")
      .all();
    
    // 3. landing_pages FK 확인
    const landingPagesForeignKeys = await db
      .prepare("PRAGMA foreign_key_list(landing_pages)")
      .all();
    
    // 4. User 테이블 구조
    const userSchema = await db
      .prepare("PRAGMA table_info(User)")
      .all();
    
    // 5. 샘플 User 데이터 (id와 email만)
    const sampleUsers = await db
      .prepare("SELECT id, email, role FROM User LIMIT 5")
      .all();
    
    // 6. 현재 landing_pages 개수
    const landingPagesCount = await db
      .prepare("SELECT COUNT(*) as count FROM landing_pages")
      .first();
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          tables: tables.results,
          landingPages: {
            schema: landingPagesSchema.results,
            foreignKeys: landingPagesForeignKeys.results,
            count: landingPagesCount?.count || 0,
          },
          user: {
            schema: userSchema.results,
            samples: sampleUsers.results,
          },
        },
      }, null, 2),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
