// 대행 로그인 API (관리자가 사용자 계정으로 로그인)
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

    // 사용자 정보 조회
    const user = await env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.phone, u.role, u.academyId,
             a.name as academyName, a.code as academyCode
      FROM User u
      LEFT JOIN Academy a ON u.academyId = a.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "사용자를 찾을 수 없습니다" 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 대행 로그인용 토큰 생성
    const impersonateToken = `${user.id}|${user.email}|${user.role}|${Date.now()}`;

    console.log('👤 대행 로그인:', { adminEmail, targetUser: user.email, targetRole: user.role });

    // 활동 로그 기록
    try {
      await env.DB.prepare(`
        INSERT INTO ActivityLog (id, userId, action, details, ip, createdAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        '대행 로그인',
        `관리자(${adminEmail})가 이 계정으로 대행 로그인하였습니다`,
        request.headers.get('CF-Connecting-IP') || 'unknown',
      ).run();
    } catch (logError) {
      console.log('활동 로그 기록 실패 (무시):', logError.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      token: impersonateToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        academyId: user.academyId,
        academyName: user.academyName,
        academyCode: user.academyCode
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('대행 로그인 오류:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "대행 로그인 중 오류가 발생했습니다" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
