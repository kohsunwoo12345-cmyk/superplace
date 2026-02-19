// 비밀번호 재설정 API
export async function onRequestPost(context) {
  const { request, env, params } = context;
  
  if (!env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Database not configured" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "인증 토큰이 필요합니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const [adminId, adminEmail, adminRole] = token.split('|');

    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminRole)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "관리자 권한이 필요합니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = params.id;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "새 비밀번호는 최소 6자 이상이어야 합니다" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SHA-256 해싱 (login.js와 동일한 방식)
    const encoder = new TextEncoder();
    const data = encoder.encode(newPassword + 'superplace-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('🔐 비밀번호 재설정:', { userId, newPasswordLength: newPassword.length, hashedLength: hashedPassword.length });

    // 비밀번호 업데이트
    const updateResult = await env.DB.prepare(
      'UPDATE User SET password = ?, updatedAt = datetime("now") WHERE id = ?'
    ).bind(hashedPassword, userId).run();

    if (!updateResult.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "비밀번호 업데이트 실패" 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 활동 로그 기록 (선택사항)
    try {
      await env.DB.prepare(`
        INSERT INTO ActivityLog (id, userId, action, details, ip, createdAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        '비밀번호 재설정',
        `관리자(${adminEmail})에 의해 비밀번호가 재설정되었습니다`,
        request.headers.get('CF-Connecting-IP') || 'unknown',
      ).run();
    } catch (logError) {
      console.log('활동 로그 기록 실패 (무시):', logError.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "비밀번호가 성공적으로 재설정되었습니다" 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "비밀번호 재설정 중 오류가 발생했습니다" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
