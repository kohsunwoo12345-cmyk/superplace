// homework_submissions 테이블 생성 API
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    // homework_submissions 테이블 생성
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
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 인덱스 생성 (검색 성능 향상)
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_homework_submissions_userId 
      ON homework_submissions(userId)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_homework_submissions_submittedAt 
      ON homework_submissions(submittedAt)
    `).run();

    // 테이블 구조 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(homework_submissions)
    `).all();

    // 샘플 데이터 개수 확인
    const count = await DB.prepare(`
      SELECT COUNT(*) as count FROM homework_submissions
    `).first();

    return new Response(JSON.stringify({
      success: true,
      message: 'homework_submissions 테이블 생성 완료',
      table: 'homework_submissions',
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
      error: 'homework_submissions 테이블 생성 실패',
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
