interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');

    if (!academyId) {
      return new Response(JSON.stringify({ error: 'academyId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results: any = {
      academyId,
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // 1. homework_submissions 테이블 확인
    try {
      const hwCount = await DB.prepare(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN submittedAt IS NOT NULL THEN 1 END) as submitted
        FROM homework_submissions hs
        JOIN users u ON hs.userId = u.id
        WHERE u.academyId = ?
      `).bind(academyId).first();
      
      const hwSample = await DB.prepare(`
        SELECT hs.id, hs.userId, hs.submittedAt, u.academyId
        FROM homework_submissions hs
        JOIN users u ON hs.userId = u.id
        WHERE u.academyId = ?
        LIMIT 3
      `).bind(academyId).all();

      results.tables.homework_submissions = {
        exists: true,
        count: hwCount,
        sample: hwSample.results
      };
    } catch (e: any) {
      results.tables.homework_submissions = {
        exists: false,
        error: e.message
      };
    }

    // 2. landing_pages 테이블 확인
    try {
      const lpCount = await DB.prepare(`
        SELECT COUNT(*) as total
        FROM landing_pages
        WHERE academyId = ?
      `).bind(academyId).first();
      
      const lpSample = await DB.prepare(`
        SELECT id, academyId, createdAt, title
        FROM landing_pages
        WHERE academyId = ?
        LIMIT 3
      `).bind(academyId).all();

      results.tables.landing_pages = {
        exists: true,
        count: lpCount,
        sample: lpSample.results
      };
    } catch (e: any) {
      results.tables.landing_pages = {
        exists: false,
        error: e.message
      };
    }

    // 3. usage_logs 테이블 확인
    try {
      const ulCount = await DB.prepare(`
        SELECT 
          ul.type,
          COUNT(*) as count
        FROM usage_logs ul
        JOIN users u ON ul.userId = u.id
        WHERE u.academyId = ?
        GROUP BY ul.type
      `).bind(academyId).all();

      results.tables.usage_logs = {
        exists: true,
        counts: ulCount.results
      };
    } catch (e: any) {
      results.tables.usage_logs = {
        exists: false,
        error: e.message
      };
    }

    // 4. User 테이블에서 academyId 확인
    try {
      const userCount = await DB.prepare(`
        SELECT 
          role,
          COUNT(*) as count
        FROM User
        WHERE academyId = ?
        GROUP BY role
      `).bind(academyId).all();

      results.tables.users = {
        exists: true,
        counts: userCount.results
      };
    } catch (e: any) {
      results.tables.users = {
        exists: false,
        error: e.message
      };
    }

    // 5. user_subscriptions 확인
    try {
      const subData = await DB.prepare(`
        SELECT us.*, u.academyId
        FROM user_subscriptions us
        JOIN users u ON us.userId = u.id
        WHERE u.academyId = ?
        LIMIT 1
      `).bind(academyId).first();

      results.subscription = subData || null;
    } catch (e: any) {
      results.subscription = {
        error: e.message
      };
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'Debug failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
