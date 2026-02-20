// API: 봇 구매 요청 목록 조회
// GET /api/admin/bot-purchase-requests

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

export async function onRequestGet(context) {
  const { request, env } = context;

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

    // bot_purchase_requests 테이블 생성 (없을 경우)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS bot_purchase_requests (
        id TEXT PRIMARY KEY,
        academyId TEXT NOT NULL,
        botId TEXT NOT NULL,
        requestedBy TEXT NOT NULL,
        durationMonths INTEGER NOT NULL,
        price INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        requestedAt TEXT DEFAULT (datetime('now')),
        requestIp TEXT,
        userAgent TEXT,
        notes TEXT,
        approvedAt TEXT,
        approvedBy TEXT,
        rejectedAt TEXT,
        rejectedBy TEXT,
        rejectionReason TEXT,
        FOREIGN KEY (academyId) REFERENCES Academy(id),
        FOREIGN KEY (botId) REFERENCES ai_bots(id),
        FOREIGN KEY (requestedBy) REFERENCES User(id)
      );
    `);

    console.log('📋 봇 구매 요청 목록 조회');

    // 모든 구매 요청 조회 (최신순)
    const requestsResult = await env.DB.prepare(`
      SELECT 
        bpr.id,
        bpr.academyId,
        a.name as academyName,
        bpr.botId,
        ab.name as botName,
        ab.profileIcon as botIcon,
        bpr.requestedBy,
        u.name as requestedByName,
        u.email as requestedByEmail,
        bpr.durationMonths,
        bpr.price,
        bpr.status,
        bpr.requestedAt,
        bpr.requestIp,
        bpr.userAgent,
        bpr.notes,
        bpr.approvedAt,
        bpr.approvedBy,
        bpr.rejectedAt,
        bpr.rejectedBy,
        bpr.rejectionReason
      FROM bot_purchase_requests bpr
      LEFT JOIN Academy a ON bpr.academyId = a.id
      LEFT JOIN ai_bots ab ON bpr.botId = ab.id
      LEFT JOIN User u ON bpr.requestedBy = u.id
      ORDER BY bpr.requestedAt DESC
    `).all();

    const requests = requestsResult.results || [];

    console.log('✅ 봇 구매 요청 조회 완료:', requests.length, '개');

    return new Response(JSON.stringify({
      success: true,
      requests,
      count: requests.length,
      stats: {
        total: requests.length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("봇 구매 요청 조회 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "봇 구매 요청 조회 실패"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
