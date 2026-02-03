// Cloudflare Pages Functions - 테이블 스키마 디버그 API
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

    // users 테이블 스키마 확인
    const schema = await context.env.DB.prepare(
      "PRAGMA table_info(users)"
    ).all();

    // 샘플 데이터 1개 조회
    const sampleUser = await context.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    )
      .bind('admin@superplace.co.kr')
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          schema: schema.results,
          sampleUser: sampleUser,
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
