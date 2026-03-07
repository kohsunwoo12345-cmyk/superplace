interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: []
    };
    
    // 1. 테이블 구조 확인
    try {
      const schema = await DB.prepare(`PRAGMA table_info(landing_pages)`).all();
      results.checks.push({
        name: "테이블 구조",
        success: true,
        columns: schema.results?.map((col: any) => ({
          name: col.name,
          type: col.type,
          notnull: col.notnull,
          dflt_value: col.dflt_value
        }))
      });
    } catch (e: any) {
      results.checks.push({
        name: "테이블 구조",
        success: false,
        error: e.message
      });
    }
    
    // 2. 전체 데이터 조회 (모든 컬럼)
    try {
      const allData = await DB.prepare(`SELECT * FROM landing_pages ORDER BY id DESC LIMIT 10`).all();
      results.checks.push({
        name: "전체 데이터",
        success: true,
        count: allData.results?.length || 0,
        data: allData.results
      });
    } catch (e: any) {
      results.checks.push({
        name: "전체 데이터",
        success: false,
        error: e.message
      });
    }
    
    // 3. slug 컬럼 확인
    try {
      const slugCheck = await DB.prepare(`SELECT id, slug, title FROM landing_pages LIMIT 5`).all();
      results.checks.push({
        name: "slug 컬럼 조회",
        success: true,
        data: slugCheck.results
      });
    } catch (e: any) {
      results.checks.push({
        name: "slug 컬럼 조회",
        success: false,
        error: e.message
      });
    }
    
    // 4. User 테이블에서 DIRECTOR 조회
    try {
      const directors = await DB.prepare(`
        SELECT id, email, role, academyId 
        FROM User 
        WHERE role = 'DIRECTOR' 
        LIMIT 3
      `).all();
      results.checks.push({
        name: "DIRECTOR 사용자",
        success: true,
        count: directors.results?.length || 0,
        directors: directors.results
      });
    } catch (e: any) {
      results.checks.push({
        name: "DIRECTOR 사용자",
        success: false,
        error: e.message
      });
    }
    
    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
