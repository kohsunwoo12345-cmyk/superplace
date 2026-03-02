// Cloudflare Pages Function - 테스트용 사용자 조회
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    console.log('🔍 Finding test users...');

    // User 테이블에서 첫 번째 사용자 가져오기
    const users = await DB
      .prepare('SELECT id, email, name, role FROM User LIMIT 5')
      .all();

    if (!users.results || users.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No users found',
          hint: 'Try users table instead'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: users.results.length,
        users: users.results,
        testToken: `${users.results[0].id}|${users.results[0].email}|${users.results[0].role}|academy-1|${Date.now()}`
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error:', error);
    
    // 테이블명이 다를 수 있으므로 재시도
    try {
      const { DB } = context.env;
      const users = await DB
        .prepare('SELECT id, email, name, role FROM users LIMIT 5')
        .all();

      return new Response(
        JSON.stringify({
          success: true,
          count: users.results?.length || 0,
          users: users.results || [],
          testToken: users.results?.[0] 
            ? `${users.results[0].id}|${users.results[0].email}|${users.results[0].role}|academy-1|${Date.now()}`
            : null
        }, null, 2),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (innerError: any) {
      return new Response(
        JSON.stringify({ 
          error: error.message,
          innerError: innerError.message,
          stack: error.stack 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
