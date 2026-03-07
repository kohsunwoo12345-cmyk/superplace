// 구독 사용량 카운트를 위한 필수 테이블 생성 API
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const results = {
      timestamp: new Date().toISOString(),
      tables: {} as Record<string, any>
    };

    // 1️⃣ homework_submissions 테이블 생성
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_submissions (
          id TEXT PRIMARY KEY,
          userId INTEGER NOT NULL,
          attendanceRecordId TEXT,
          imageUrl TEXT,
          score INTEGER,
          feedback TEXT,
          subject TEXT,
          completion INTEGER,
          effort INTEGER,
          strengths TEXT,
          suggestions TEXT,
          submittedAt TEXT NOT NULL,
          gradedAt TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (userId) REFERENCES User(id)
        )
      `).run();

      // 테이블 존재 확인
      const tableInfo = await DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='homework_submissions'
      `).first();

      results.tables.homework_submissions = {
        created: true,
        exists: !!tableInfo,
        message: tableInfo ? '테이블이 성공적으로 생성되었습니다.' : '테이블이 이미 존재합니다.'
      };
    } catch (e: any) {
      results.tables.homework_submissions = {
        created: false,
        error: e.message
      };
    }

    // 2️⃣ landing_pages 테이블 생성
    try {
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

      const tableInfo = await DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='landing_pages'
      `).first();

      results.tables.landing_pages = {
        created: true,
        exists: !!tableInfo,
        message: tableInfo ? '테이블이 성공적으로 생성되었습니다.' : '테이블이 이미 존재합니다.'
      };
    } catch (e: any) {
      results.tables.landing_pages = {
        created: false,
        error: e.message
      };
    }

    // 3️⃣ usage_logs 테이블 생성
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS usage_logs (
          id TEXT PRIMARY KEY,
          userId INTEGER NOT NULL,
          type TEXT NOT NULL,
          metadata TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (userId) REFERENCES User(id)
        )
      `).run();

      // type 인덱스 생성
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_type 
        ON usage_logs(type)
      `).run();

      // userId 인덱스 생성
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_userId 
        ON usage_logs(userId)
      `).run();

      const tableInfo = await DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='usage_logs'
      `).first();

      results.tables.usage_logs = {
        created: true,
        exists: !!tableInfo,
        message: tableInfo ? '테이블 및 인덱스가 생성되었습니다.' : '테이블이 이미 존재합니다.'
      };
    } catch (e: any) {
      results.tables.usage_logs = {
        created: false,
        error: e.message
      };
    }

    // 4️⃣ 테이블 목록 확인
    const allTables = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();

    results.tables.all_tables = allTables.results.map((t: any) => t.name);

    return new Response(JSON.stringify({
      success: true,
      message: '테이블 초기화 완료',
      ...results
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
      error: '테이블 초기화 실패',
      message: error.message
    }, null, 2), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// OPTIONS 요청 처리 (CORS)
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
