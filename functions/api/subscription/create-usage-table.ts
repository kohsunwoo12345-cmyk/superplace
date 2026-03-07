// usage_logs 테이블 생성 API
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    // usage_logs 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL,
        metadata TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 인덱스 생성 (검색 성능 향상)
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_userId 
      ON usage_logs(userId)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_type 
      ON usage_logs(type)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_createdAt 
      ON usage_logs(createdAt)
    `).run();

    // type과 userId 복합 인덱스 (조회 성능 최적화)
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_type_userId 
      ON usage_logs(type, userId)
    `).run();

    // 테이블 구조 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(usage_logs)
    `).all();

    // 샘플 데이터 개수 확인
    const count = await DB.prepare(`
      SELECT COUNT(*) as count FROM usage_logs
    `).first();

    // 타입별 카운트 확인
    const typeCounts = await DB.prepare(`
      SELECT type, COUNT(*) as count 
      FROM usage_logs 
      GROUP BY type
    `).all();

    return new Response(JSON.stringify({
      success: true,
      message: 'usage_logs 테이블 생성 완료',
      table: 'usage_logs',
      columns: tableInfo.results,
      currentCount: count?.count || 0,
      typeCounts: typeCounts.results,
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
      error: 'usage_logs 테이블 생성 실패',
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
