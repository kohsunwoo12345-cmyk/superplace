// 데이터베이스 스키마 확인 API
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const db = context.env.DB;
    
    // 1. 테이블 목록 확인
    const tables = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all();
    
    // 2. landing_pages 테이블 스키마 확인
    const schema = await db
      .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='landing_pages'`)
      .first();
    
    // 3. landing_pages 데이터 개수
    const count = await db
      .prepare(`SELECT COUNT(*) as count FROM landing_pages`)
      .first();
    
    // 4. 최근 5개 데이터 샘플
    const samples = await db
      .prepare(`SELECT id, slug, title FROM landing_pages ORDER BY ROWID DESC LIMIT 5`)
      .all();
    
    // 5. 컬럼 정보 확인
    const columns = await db
      .prepare(`PRAGMA table_info(landing_pages)`)
      .all();
    
    return new Response(
      JSON.stringify({
        success: true,
        tables: tables.results,
        schema: schema?.sql || 'No schema found',
        count: count?.count || 0,
        samples: samples.results || [],
        columns: columns.results || [],
      }, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
