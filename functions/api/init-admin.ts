// Cloudflare Pages Functions - 관리자 계정 초기화 API
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

    // 기존 관리자 계정 확인
    const existingAdmin = await context.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    )
      .bind('admin@superplace.com')
      .first();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '관리자 계정이 이미 존재합니다',
          data: {
            email: 'admin@superplace.com',
            password: 'admin123456',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 관리자 계정 생성
    const adminId = 'user-admin-001';
    await context.env.DB.prepare(
      `INSERT INTO users (id, email, password, name, role, phone, approved, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        adminId,
        'admin@superplace.com',
        'admin123456',
        '시스템 관리자',
        'SUPER_ADMIN',
        '010-0000-0000',
        1
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '관리자 계정이 생성되었습니다',
        data: {
          email: 'admin@superplace.com',
          password: 'admin123456',
          role: 'SUPER_ADMIN',
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Admin init error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '관리자 계정 생성 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
