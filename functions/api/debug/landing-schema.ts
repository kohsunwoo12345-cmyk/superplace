export async function onRequestGet(context: { env: { DB: D1Database } }) {
  try {
    const { DB } = context.env;
    
    // 테이블 스키마 확인
    const schema = await DB.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='landing_pages'
    `).first();
    
    // 실제 컬럼 확인
    const columns = await DB.prepare(`PRAGMA table_info(landing_pages)`).all();
    
    // 샘플 데이터 1개 조회
    const sample = await DB.prepare(`SELECT * FROM landing_pages LIMIT 1`).first();
    
    return new Response(JSON.stringify({
      success: true,
      schema: schema,
      columns: columns.results,
      sampleKeys: sample ? Object.keys(sample) : [],
      sample: sample
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
