interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    // 테이블 구조 확인
    const structure = await DB.prepare(`PRAGMA table_info(landing_pages)`).all();
    
    // 샘플 데이터 확인
    const sample = await DB.prepare(`SELECT * FROM landing_pages LIMIT 1`).all();
    
    return new Response(JSON.stringify({
      success: true,
      columns: structure.results?.map((col: any) => col.name) || [],
      fullStructure: structure.results || [],
      sampleData: sample.results?.[0] || null,
      columnCount: structure.results?.length || 0
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
