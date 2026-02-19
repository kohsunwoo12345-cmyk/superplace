// 포인트 지급/차감 API
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
    const { amount, reason, type } = body; // type: 'add' or 'subtract'

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "올바른 포인트 금액을 입력하세요" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!reason || !reason.trim()) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "포인트 변동 사유를 입력하세요" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 현재 포인트 조회
    const userResult = await env.DB.prepare(
      'SELECT id, email, name, points FROM User WHERE id = ?'
    ).bind(userId).first();

    if (!userResult) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "사용자를 찾을 수 없습니다" 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const currentPoints = userResult.points || 0;
    let newPoints;

    if (type === 'add') {
      newPoints = currentPoints + amount;
    } else if (type === 'subtract') {
      newPoints = Math.max(0, currentPoints - amount); // 0 이하로 내려가지 않음
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "올바르지 않은 타입입니다" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 포인트 업데이트
    const updateResult = await env.DB.prepare(
      'UPDATE User SET points = ?, updatedAt = datetime("now") WHERE id = ?'
    ).bind(newPoints, userId).run();

    if (!updateResult.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "포인트 업데이트 실패" 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('💰 포인트 업데이트:', { userId, type, amount, before: currentPoints, after: newPoints });

    // 활동 로그 기록
    try {
      await env.DB.prepare(`
        INSERT INTO ActivityLog (id, userId, action, details, ip, createdAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type === 'add' ? '포인트 지급' : '포인트 차감',
        `${amount.toLocaleString()}P ${type === 'add' ? '지급' : '차감'} - ${reason} (관리자: ${adminEmail})`,
        request.headers.get('CF-Connecting-IP') || 'unknown',
      ).run();
    } catch (logError) {
      console.log('활동 로그 기록 실패 (무시):', logError.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `포인트가 ${type === 'add' ? '지급' : '차감'}되었습니다`,
      points: {
        before: currentPoints,
        after: newPoints,
        change: type === 'add' ? amount : -amount
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('포인트 업데이트 오류:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "포인트 업데이트 중 오류가 발생했습니다" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
