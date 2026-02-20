// API: 봇 구매 요청 거절
// POST /api/admin/bot-purchase-requests/[id]/reject

function parseToken(token) {
  try {
    const parts = token.split('|');
    if (parts.length >= 3) {
      return {
        id: parts[0],
        email: parts[1],
        role: parts[2]
      };
    }
  } catch (e) {
    console.error('토큰 파싱 오류:', e);
  }
  return null;
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const requestId = params.id;

  if (!env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Database not configured" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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
    const tokenData = parseToken(token);
    
    if (!tokenData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "유효하지 않은 토큰입니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(tokenData.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "관리자 권한이 필요합니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 요청 본문에서 거절 사유 추출
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "거절 사유를 입력해주세요" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log('❌ 봇 구매 요청 거절:', requestId, '| 거절자:', tokenData.email);

    // 구매 요청 조회
    const purchaseRequest = await env.DB.prepare(`
      SELECT * FROM bot_purchase_requests WHERE id = ?
    `).bind(requestId).first();

    if (!purchaseRequest) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "구매 요청을 찾을 수 없습니다" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (purchaseRequest.status !== 'PENDING') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "이미 처리된 요청입니다" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const now = new Date().toISOString();

    // 거절 처리
    await env.DB.prepare(`
      UPDATE bot_purchase_requests
      SET status = 'REJECTED',
          rejectedAt = ?,
          rejectedBy = ?,
          rejectionReason = ?
      WHERE id = ?
    `).bind(now, tokenData.email, reason, requestId).run();

    console.log('✅ 봇 구매 요청 거절 완료:', {
      requestId,
      reason,
      rejectedBy: tokenData.email
    });

    return new Response(JSON.stringify({
      success: true,
      message: "구매 요청이 거절되었습니다"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("봇 구매 요청 거절 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "거절 처리 실패"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
