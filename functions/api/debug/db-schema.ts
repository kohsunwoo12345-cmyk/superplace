export async function onRequestGet(context: { env: { DB: D1Database } }) {
  try {
    const { DB } = context.env;
    
    // 실제 landing_pages 테이블의 컬럼 정보
    const columns = await DB.prepare(`PRAGMA table_info(landing_pages)`).all();
    
    // 샘플 데이터 1개 조회하여 실제 필드명 확인
    const sample = await DB.prepare(`SELECT * FROM landing_pages LIMIT 1`).first();
    
    return new Response(JSON.stringify({
      success: true,
      columns: columns.results,
      sampleKeys: sample ? Object.keys(sample) : [],
      columnNames: columns.results?.map((c: any) => c.name) || []
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
