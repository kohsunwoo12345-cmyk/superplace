// 데이터베이스 직접 조회 및 디버깅 API
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    
    console.log('🔍 DEBUG: 데이터베이스 상태 조회 시작');
    console.log('📝 academyId:', academyId);
    
    // 1. user_subscriptions 테이블 존재 확인
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name = 'user_subscriptions'
    `).all();
    
    console.log('📊 테이블 존재 여부:', tables.results);
    
    if (!tables.results || tables.results.length === 0) {
      return new Response(JSON.stringify({
        error: 'user_subscriptions 테이블이 존재하지 않음',
        tables: tables.results,
        action: 'POST /api/admin/create-subscription-tables 호출 필요'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. 테이블 스키마 확인
    const schema = await DB.prepare(`
      PRAGMA table_info(user_subscriptions)
    `).all();
    
    console.log('📋 테이블 스키마:', schema.results);
    
    // 3. 전체 구독 데이터 조회
    const allSubscriptions = await DB.prepare(`
      SELECT * FROM user_subscriptions
    `).all();
    
    console.log('📦 전체 구독 수:', allSubscriptions.results?.length || 0);
    
    // 4. academyId로 사용자 조회
    let users = [];
    let directorUser = null;
    
    if (academyId) {
      users = await DB.prepare(`
        SELECT id, email, name, role, academyId FROM User
        WHERE academyId = ?
      `).bind(academyId).all();
      
      console.log('👥 학원 사용자 수:', users.results?.length || 0);
      
      directorUser = await DB.prepare(`
        SELECT id, email, name, role, academyId FROM User
        WHERE academyId = ? AND role = 'DIRECTOR'
      `).bind(academyId).first();
      
      console.log('👤 학원장 정보:', directorUser);
    }
    
    // 5. 학원장의 구독 조회 (실제 API가 사용하는 쿼리)
    let subscription = null;
    if (academyId) {
      subscription = await DB.prepare(`
        SELECT us.* FROM user_subscriptions us
        JOIN users u ON us.userId = u.id
        WHERE u.academyId = ? 
          AND u.role = 'DIRECTOR'
          AND us.status = 'active'
        ORDER BY us.endDate DESC
        LIMIT 1
      `).bind(academyId).first();
      
      console.log('🎫 학원장 구독:', subscription);
    }
    
    // 6. 학원장 userId로 직접 구독 조회
    let subscriptionByUserId = null;
    if (directorUser) {
      subscriptionByUserId = await DB.prepare(`
        SELECT * FROM user_subscriptions
        WHERE userId = ?
      `).bind(directorUser.id).all();
      
      console.log('🎫 userId로 구독 조회:', subscriptionByUserId.results);
    }
    
    // 7. subscription_requests 테이블 확인
    const requestsTableExists = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name = 'subscription_requests'
    `).all();
    
    let subscriptionRequests = [];
    if (requestsTableExists.results && requestsTableExists.results.length > 0) {
      if (academyId && directorUser) {
        subscriptionRequests = await DB.prepare(`
          SELECT * FROM subscription_requests
          WHERE userId = ?
          ORDER BY requestedAt DESC
        `).bind(directorUser.id).all();
      } else {
        subscriptionRequests = await DB.prepare(`
          SELECT * FROM subscription_requests
          ORDER BY requestedAt DESC
          LIMIT 10
        `).all();
      }
      
      console.log('📝 구독 신청 내역:', subscriptionRequests.results);
    }
    
    return new Response(JSON.stringify({
      success: true,
      debug: {
        tableExists: tables.results?.length > 0,
        schema: schema.results?.map((col: any) => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value
        })),
        columnCount: schema.results?.length || 0,
        academyId,
        directorUser: directorUser ? {
          id: directorUser.id,
          email: directorUser.email,
          name: directorUser.name,
          role: directorUser.role,
          academyId: directorUser.academyId
        } : null,
        allUsersInAcademy: users.results?.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role
        })),
        subscriptionFound: !!subscription,
        subscriptionData: subscription,
        subscriptionsByUserId: subscriptionByUserId?.results || [],
        allSubscriptionsCount: allSubscriptions.results?.length || 0,
        allSubscriptions: allSubscriptions.results || [],
        subscriptionRequests: subscriptionRequests.results || [],
        requestsTableExists: requestsTableExists.results?.length > 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ 디버그 API 오류:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
