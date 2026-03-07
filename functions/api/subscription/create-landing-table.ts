// landing_pages 테이블 생성 API
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    // landing_pages 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS landing_pages (
        id TEXT PRIMARY KEY,
        academyId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        slug TEXT UNIQUE,
        status TEXT DEFAULT 'draft',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT,
        publishedAt TEXT
      )
    `).run();

    // 인덱스 생성
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_landing_pages_academyId 
      ON landing_pages(academyId)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_landing_pages_createdAt 
      ON landing_pages(createdAt)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_landing_pages_status 
      ON landing_pages(status)
    `).run();

    // 테이블 구조 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(landing_pages)
    `).all();

    // 샘플 데이터 개수 확인
    const count = await DB.prepare(`
      SELECT COUNT(*) as count FROM landing_pages
    `).first();

    return new Response(JSON.stringify({
      success: true,
      message: 'landing_pages 테이블 생성 완료',
      table: 'landing_pages',
      columns: tableInfo.results,
      currentCount: count?.count || 0,
      created: true
    }, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'landing_pages 테이블 생성 실패',
      message: error.message,
      details: error.toString()
    }, null, 2), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
