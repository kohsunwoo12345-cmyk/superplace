// 간단한 테이블 구조 확인 API (user_id vs userId 확인)
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const results: any = {};

    // 1. user_subscriptions 테이블 컬럼 확인
    try {
      const query1 = await DB.prepare(`SELECT * FROM user_subscriptions LIMIT 1`).first();
      results.user_subscriptions = {
        success: true,
        columns: query1 ? Object.keys(query1) : [],
        sampleData: query1
      };
    } catch (e: any) {
      results.user_subscriptions = { success: false, error: e.message };
    }

    // 2. usage_logs 테이블 컬럼 확인
    try {
      const query2 = await DB.prepare(`SELECT * FROM usage_logs LIMIT 1`).first();
      results.usage_logs = {
        success: true,
        columns: query2 ? Object.keys(query2) : [],
        sampleData: query2
      };
    } catch (e: any) {
      results.usage_logs = { success: false, error: e.message };
    }

    // 3. homework_submissions 테이블 컬럼 확인
    try {
      const query3 = await DB.prepare(`SELECT * FROM homework_submissions LIMIT 1`).first();
      results.homework_submissions = {
        success: true,
        columns: query3 ? Object.keys(query3) : [],
        sampleData: query3
      };
    } catch (e: any) {
      results.homework_submissions = { success: false, error: e.message };
    }

    // 4. landing_pages 테이블 컬럼 확인
    try {
      const query4 = await DB.prepare(`SELECT * FROM landing_pages LIMIT 1`).first();
      results.landing_pages = {
        success: true,
        columns: query4 ? Object.keys(query4) : [],
        sampleData: query4
      };
    } catch (e: any) {
      results.landing_pages = { success: false, error: e.message };
    }

    // 5. User 테이블 컬럼 확인
    try {
      const query5 = await DB.prepare(`SELECT * FROM User LIMIT 1`).first();
      results.User = {
        success: true,
        columns: query5 ? Object.keys(query5) : [],
        sampleData: query5
      };
    } catch (e: any) {
      results.User = { success: false, error: e.message };
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
