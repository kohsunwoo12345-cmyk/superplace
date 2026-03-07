// D1 데이터베이스 스키마 확인 API
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const results: any = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // 1. 모든 테이블 목록 조회
    const allTables = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();

    results.tableList = allTables.results.map((t: any) => t.name);

    // 2. 각 테이블의 CREATE TABLE 문 조회
    for (const table of allTables.results) {
      const tableName = table.name;
      
      try {
        // CREATE TABLE 문 가져오기
        const createStmt = await DB.prepare(`
          SELECT sql FROM sqlite_master 
          WHERE type='table' AND name=?
        `).bind(tableName).first();

        // PRAGMA로 컬럼 정보 가져오기
        const columns = await DB.prepare(`
          PRAGMA table_info(${tableName})
        `).all();

        // 샘플 데이터 1개 가져오기
        let sampleData = null;
        try {
          const sample = await DB.prepare(`
            SELECT * FROM ${tableName} LIMIT 1
          `).first();
          sampleData = sample;
        } catch (e) {
          sampleData = null;
        }

        results.tables[tableName] = {
          createStatement: createStmt?.sql || 'N/A',
          columns: columns.results,
          sampleData: sampleData
        };
      } catch (e: any) {
        results.tables[tableName] = {
          error: e.message
        };
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Schema check failed',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
