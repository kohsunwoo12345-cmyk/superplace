// Debug API: Check Sender Number Data
// GET /api/debug/check-sender-data?userId=xxx

interface Env {
  DB: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const requestId = url.searchParams.get('requestId');
    
    const db = context.env.DB;
    const results: any = {};

    // 1. sender_number_requests 테이블 확인
    if (requestId) {
      const request = await db
        .prepare('SELECT * FROM sender_number_requests WHERE id = ?')
        .bind(requestId)
        .first();
      results.senderRequest = request;
      
      console.log('📋 Sender Request:', request);
    } else {
      const requests = await db
        .prepare('SELECT * FROM sender_number_requests ORDER BY createdAt DESC LIMIT 5')
        .all();
      results.recentRequests = requests.results;
    }

    // 2. User 테이블 확인 (파스칼케이스)
    if (userId) {
      const userPascal = await db
        .prepare('SELECT id, email, name, approvedSenderNumbers FROM users WHERE id = ?')
        .bind(userId)
        .first();
      results.userPascal = userPascal;
      console.log('👤 User (Pascal):', userPascal);
    }

    // 3. users 테이블 확인 (스네이크케이스)
    if (userId) {
      const userSnake = await db
        .prepare('SELECT id, email, name, approved_sender_numbers FROM users WHERE id = ?')
        .bind(userId)
        .first();
      results.userSnake = userSnake;
      console.log('👤 users (snake):', userSnake);
    }

    // 4. SMSSender 테이블 확인
    if (userId) {
      const senders = await db
        .prepare('SELECT * FROM SMSSender WHERE userId = ?')
        .bind(userId)
        .all();
      results.smsSenders = senders.results;
      console.log('📱 SMS Senders:', senders.results);
    } else {
      const allSenders = await db
        .prepare('SELECT * FROM SMSSender ORDER BY createdAt DESC LIMIT 10')
        .all();
      results.allSenders = allSenders.results;
    }

    // 5. 테이블 구조 확인
    const userTableInfo = await db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='User'")
      .first();
    results.userTableSchema = userTableInfo;

    const usersTableInfo = await db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
      .first();
    results.usersTableSchema = usersTableInfo;

    const senderRequestsTableInfo = await db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='sender_number_requests'")
      .first();
    results.senderRequestsTableSchema = senderRequestsTableInfo;

    return new Response(
      JSON.stringify({
        success: true,
        debug: results,
        instructions: {
          usage: 'GET /api/debug/check-sender-data?userId=xxx&requestId=yyy',
          checkUser: '사용자 ID로 User/users 테이블 확인',
          checkRequest: 'requestId로 신청 정보 확인',
          tables: '테이블 스키마 확인'
        }
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Debug API 오류:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
