// API: 봇 구매 요청 생성 (학원장용)
// POST /api/bot-purchase-requests

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

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function onRequestPost(context) {
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

    // 사용자 정보 조회
    const user = await env.DB.prepare(`
      SELECT id, email, name, role, academyId FROM User WHERE email = ?
    `).bind(tokenData.email).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "사용자를 찾을 수 없습니다" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 학원장 또는 관리자 권한 확인
    if (!['DIRECTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "학원장 또는 관리자 권한이 필요합니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학원장은 반드시 학원이 할당되어 있어야 함
    if (user.role === 'DIRECTOR' && !user.academyId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "학원이 할당되지 않았습니다" 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { botId, durationMonths, notes } = body;

    if (!botId || !durationMonths) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "봇 ID와 구독 기간이 필요합니다" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 기간 검증 (1, 3, 6, 12개월만 허용)
    const validDurations = [1, 3, 6, 12];
    if (!validDurations.includes(parseInt(durationMonths))) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "구독 기간은 1, 3, 6, 12개월 중 하나여야 합니다" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 봇 정보 조회
    const bot = await env.DB.prepare(`
      SELECT id, name, profileIcon FROM ai_bots WHERE id = ?
    `).bind(botId).first();

    if (!bot) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "봇을 찾을 수 없습니다" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 가격 계산 (기본 월 10만원)
    const monthlyPrice = 100000;
    let totalPrice = monthlyPrice * durationMonths;
    
    // 할인 적용
    if (durationMonths >= 12) {
      totalPrice = totalPrice * 0.8; // 20% 할인
    } else if (durationMonths >= 6) {
      totalPrice = totalPrice * 0.9; // 10% 할인
    }

    // 요청 IP 및 User-Agent 추출
    const requestIp = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      request.headers.get('X-Real-IP') || 
                      'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    // bot_purchase_requests 테이블 생성
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

    const requestId = generateId('purchase-req');
    
    await env.DB.prepare(`
      INSERT INTO bot_purchase_requests (
        id, academyId, botId, requestedBy, durationMonths, price, 
        requestIp, userAgent, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      requestId,
      user.academyId,
      botId,
      user.id,
      durationMonths,
      totalPrice,
      requestIp,
      userAgent,
      notes || null
    ).run();

    console.log('✅ 봇 구매 요청 생성 완료:', {
      requestId,
      academyId: user.academyId,
      botId,
      botName: bot.name,
      durationMonths,
      price: totalPrice,
      requestedBy: user.email,
      requestIp
    });

    return new Response(JSON.stringify({
      success: true,
      message: "구매 요청이 생성되었습니다. 관리자 승인을 기다려주세요.",
      request: {
        id: requestId,
        botName: bot.name,
        durationMonths,
        price: totalPrice,
        status: "PENDING"
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("봇 구매 요청 생성 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "구매 요청 생성 실패"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
