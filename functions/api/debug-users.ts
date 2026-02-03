// Cloudflare Pages Functions - 사용자 목록 디버그 API
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    // D1 바인딩 확인
    if (!context.env || !context.env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'D1 데이터베이스 바인딩이 설정되지 않았습니다',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 모든 테이블 확인
    const tables = await context.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();

    // users 테이블의 모든 사용자 조회 (비밀번호 포함 - 디버깅용)
    let users = null;
    try {
      users = await context.env.DB.prepare(
        'SELECT id, email, password, name, role FROM users LIMIT 10'
      ).all();
    } catch (e) {
      users = { error: e instanceof Error ? e.message : 'Unknown error' };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tables: tables.results,
          users: users,
        },
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Debug error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '디버그 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
