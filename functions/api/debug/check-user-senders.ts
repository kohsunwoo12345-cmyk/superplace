// Debug: Check User Approved Sender Numbers
// GET /api/debug/check-user-senders?email=xxx

export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const userId = url.searchParams.get('userId');
    
    if (!email && !userId) {
      return new Response(
        JSON.stringify({ error: 'email 또는 userId 파라미터가 필요합니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const db = env.DB;
    const results: any = {};
    
    // User 테이블 조회 (파스칼케이스)
    try {
      if (email) {
        results.userByEmail = await db
          .prepare('SELECT * FROM User WHERE email = ?')
          .bind(email)
          .first();
      }
      
      if (userId) {
        results.userById = await db
          .prepare('SELECT * FROM User WHERE id = ?')
          .bind(userId)
          .first();
      }
    } catch (e: any) {
      results.userTableError = e.message;
    }
    
    // users 테이블 조회 (스네이크케이스)
    try {
      if (email) {
        results.usersLowerByEmail = await db
          .prepare('SELECT * FROM users WHERE email = ?')
          .bind(email)
          .first();
      }
      
      if (userId) {
        results.usersLowerById = await db
          .prepare('SELECT * FROM users WHERE id = ?')
          .bind(userId)
          .first();
      }
    } catch (e: any) {
      results.usersTableError = e.message;
    }
    
    // SMSSender 테이블 조회
    const targetUserId = userId || results.userByEmail?.id || results.usersLowerByEmail?.id;
    if (targetUserId) {
      const senders = await db
        .prepare('SELECT * FROM SMSSender WHERE userId = ?')
        .bind(targetUserId)
        .all();
      results.smsSenders = senders.results;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        query: { email, userId },
        results
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('❌ 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
