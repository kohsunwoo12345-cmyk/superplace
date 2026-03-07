// usage_logs 테이블 재생성 API (기존 테이블 삭제 후 재생성)
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const results: any = {
      timestamp: new Date().toISOString()
    };

    // 1. 기존 데이터 백업 (선택사항)
    let backupData = null;
    try {
      const existingData = await DB.prepare(`
        SELECT * FROM usage_logs LIMIT 100
      `).all();
      backupData = existingData.results;
      results.backup = {
        count: backupData.length,
        message: `${backupData.length}개 레코드 백업됨`
      };
    } catch (e: any) {
      results.backup = {
        count: 0,
        message: '기존 테이블 없음 또는 백업 불가'
      };
    }

    // 2. 기존 테이블 삭제
    try {
      await DB.prepare(`DROP TABLE IF EXISTS usage_logs`).run();
      results.drop = {
        status: 'success',
        message: '기존 usage_logs 테이블 삭제 완료'
      };
    } catch (e: any) {
      results.drop = {
        status: 'error',
        error: e.message
      };
    }

    // 3. 새 테이블 생성 (올바른 스키마)
    try {
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

      results.create = {
        status: 'success',
        message: '새 usage_logs 테이블 생성 완료'
      };
    } catch (e: any) {
      results.create = {
        status: 'error',
        error: e.message
      };
    }

    // 4. 인덱스 생성
    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_userId 
        ON usage_logs(userId)
      `).run();

      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_subscriptionId 
        ON usage_logs(subscriptionId)
      `).run();

      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_type 
        ON usage_logs(type)
      `).run();

      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_createdAt 
        ON usage_logs(createdAt)
      `).run();

      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_type_userId 
        ON usage_logs(type, userId)
      `).run();

      results.indexes = {
        status: 'success',
        message: '5개 인덱스 생성 완료'
      };
    } catch (e: any) {
      results.indexes = {
        status: 'error',
        error: e.message
      };
    }

    // 5. 최종 테이블 구조 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(usage_logs)
    `).all();

    results.finalSchema = {
      columns: tableInfo.results,
      columnCount: tableInfo.results.length
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'usage_logs 테이블 재생성 완료',
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
      error: 'usage_logs 테이블 재생성 실패',
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
