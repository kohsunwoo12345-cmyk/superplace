// usage_logs 테이블에 subscriptionId 컬럼 추가 (마이그레이션)
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const results: any = {
      timestamp: new Date().toISOString(),
      migrations: []
    };

    // 1. subscriptionId 컬럼 추가 (이미 있으면 무시)
    try {
      await DB.prepare(`
        ALTER TABLE usage_logs 
        ADD COLUMN subscriptionId INTEGER
      `).run();
      
      results.migrations.push({
        table: 'usage_logs',
        column: 'subscriptionId',
        status: 'added',
        message: 'subscriptionId 컬럼 추가 완료'
      });
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        results.migrations.push({
          table: 'usage_logs',
          column: 'subscriptionId',
          status: 'exists',
          message: 'subscriptionId 컬럼이 이미 존재합니다'
        });
      } else {
        results.migrations.push({
          table: 'usage_logs',
          column: 'subscriptionId',
          status: 'error',
          error: e.message
        });
      }
    }

    // 2. action 컬럼 추가 (이미 있으면 무시)
    try {
      await DB.prepare(`
        ALTER TABLE usage_logs 
        ADD COLUMN action TEXT
      `).run();
      
      results.migrations.push({
        table: 'usage_logs',
        column: 'action',
        status: 'added',
        message: 'action 컬럼 추가 완료'
      });
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        results.migrations.push({
          table: 'usage_logs',
          column: 'action',
          status: 'exists',
          message: 'action 컬럼이 이미 존재합니다'
        });
      } else {
        results.migrations.push({
          table: 'usage_logs',
          column: 'action',
          status: 'error',
          error: e.message
        });
      }
    }

    // 3. 최종 테이블 구조 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(usage_logs)
    `).all();

    results.finalSchema = tableInfo.results;

    // 4. 데이터 개수 확인
    const count = await DB.prepare(`
      SELECT COUNT(*) as count FROM usage_logs
    `).first();

    results.currentCount = count?.count || 0;

    return new Response(JSON.stringify({
      success: true,
      message: 'usage_logs 테이블 마이그레이션 완료',
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
      error: 'usage_logs 마이그레이션 실패',
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
