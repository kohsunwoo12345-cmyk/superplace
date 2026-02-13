// Admin role 확인 및 수정 API
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    if (!context.env?.DB) {
      return new Response(JSON.stringify({ success: false, message: 'DB not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email } = await context.request.json();

    // admin 계정 조회
    const user = await context.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // role이 ADMIN이 아니면 수정
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      await context.env.DB.prepare(
        'UPDATE users SET role = ? WHERE email = ?'
      ).bind('ADMIN', email).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Role이 ADMIN으로 업데이트되었습니다',
        before: user.role,
        after: 'ADMIN'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Role이 이미 관리자입니다',
      role: user.role
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Role update error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '오류가 발생했습니다',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
