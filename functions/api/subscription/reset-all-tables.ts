// 모든 필수 테이블 한 번에 생성 (DROP 후 재생성)
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const results: any = {
      timestamp: new Date().toISOString(),
      steps: []
    };

    // 1️⃣ homework_submissions 테이블
    try {
      await DB.prepare(`DROP TABLE IF EXISTS homework_submissions`).run();
      await DB.prepare(`
        CREATE TABLE homework_submissions (
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
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
      
      await DB.prepare(`CREATE INDEX idx_hw_userId ON homework_submissions(userId)`).run();
      await DB.prepare(`CREATE INDEX idx_hw_submittedAt ON homework_submissions(submittedAt)`).run();
      
      results.steps.push({ table: 'homework_submissions', status: 'created' });
    } catch (e: any) {
      results.steps.push({ table: 'homework_submissions', status: 'error', error: e.message });
    }

    // 2️⃣ landing_pages 테이블
    try {
      await DB.prepare(`DROP TABLE IF EXISTS landing_pages`).run();
      await DB.prepare(`
        CREATE TABLE landing_pages (
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
      
      await DB.prepare(`CREATE INDEX idx_lp_academyId ON landing_pages(academyId)`).run();
      await DB.prepare(`CREATE INDEX idx_lp_createdAt ON landing_pages(createdAt)`).run();
      
      results.steps.push({ table: 'landing_pages', status: 'created' });
    } catch (e: any) {
      results.steps.push({ table: 'landing_pages', status: 'error', error: e.message });
    }

    // 3️⃣ usage_logs 테이블
    try {
      await DB.prepare(`DROP TABLE IF EXISTS usage_logs`).run();
      await DB.prepare(`
        CREATE TABLE usage_logs (
          id TEXT PRIMARY KEY,
          userId INTEGER NOT NULL,
          subscriptionId INTEGER,
          type TEXT NOT NULL,
          action TEXT,
          metadata TEXT,
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
      
      await DB.prepare(`CREATE INDEX idx_ul_userId ON usage_logs(userId)`).run();
      await DB.prepare(`CREATE INDEX idx_ul_subscriptionId ON usage_logs(subscriptionId)`).run();
      await DB.prepare(`CREATE INDEX idx_ul_type ON usage_logs(type)`).run();
      await DB.prepare(`CREATE INDEX idx_ul_createdAt ON usage_logs(createdAt)`).run();
      
      results.steps.push({ table: 'usage_logs', status: 'created' });
    } catch (e: any) {
      results.steps.push({ table: 'usage_logs', status: 'error', error: e.message });
    }

    // 4️⃣ 테이블 목록 확인
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all();
    
    results.finalTables = tables.results;

    return new Response(JSON.stringify({
      success: true,
      message: '✅ 모든 테이블 생성 완료',
      warning: '⚠️ 기존 데이터가 삭제되었습니다',
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
      error: error.message
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
