// Cloudflare Pages Function - 랜딩페이지 원시 데이터 확인
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const db = context.env.DB;
    
    console.log('🔍 Starting raw data check...');
    
    // 1. 테이블 구조 확인
    const tableInfo = await db.prepare(`PRAGMA table_info(landing_pages)`).all();
    console.log('📊 Table structure:', JSON.stringify(tableInfo.results));
    
    // 2. 모든 랜딩페이지 조회 (필터 없이)
    const allPages = await db.prepare(`
      SELECT * FROM landing_pages 
      ORDER BY ROWID DESC 
      LIMIT 10
    `).all();
    console.log('📊 All pages count:', allPages.results?.length || 0);
    
    // 3. 총 레코드 수
    const count = await db.prepare(`SELECT COUNT(*) as total FROM landing_pages`).first();
    console.log('📊 Total records:', count?.total);
    
    // 4. 최근 생성된 페이지들
    const recentPages = await db.prepare(`
      SELECT 
        id,
        title,
        slug,
        created_at,
        ROWID
      FROM landing_pages 
      ORDER BY ROWID DESC 
      LIMIT 5
    `).all();
    console.log('📊 Recent pages:', JSON.stringify(recentPages.results));
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        tableStructure: {
          columns: tableInfo.results?.map((col: any) => ({
            name: col.name,
            type: col.type,
            notNull: col.notnull === 1,
            defaultValue: col.dflt_value
          })) || []
        },
        totalRecords: count?.total || 0,
        allPages: allPages.results || [],
        recentPages: recentPages.results || []
      }, null, 2),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Debug error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Debug failed",
        stack: error.stack,
        success: false
      }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
