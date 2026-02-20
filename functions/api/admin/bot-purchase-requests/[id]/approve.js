// API: 봇 구매 요청 승인
// POST /api/admin/bot-purchase-requests/[id]/approve

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

    console.log('✅ 봇 구매 요청 승인:', requestId, '| 승인자:', tokenData.email);

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

    // 승인 처리
    await env.DB.prepare(`
      UPDATE bot_purchase_requests
      SET status = 'APPROVED',
          approvedAt = ?,
          approvedBy = ?
      WHERE id = ?
    `).bind(now, tokenData.email, requestId).run();

    // 봇 할당 생성 (bot_assignments 테이블)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS bot_assignments (
        id TEXT PRIMARY KEY,
        academyId TEXT NOT NULL,
        botId TEXT NOT NULL,
        userId TEXT,
        startDate TEXT DEFAULT (date('now')),
        endDate TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        createdBy TEXT,
        FOREIGN KEY (academyId) REFERENCES Academy(id),
        FOREIGN KEY (botId) REFERENCES ai_bots(id),
        FOREIGN KEY (userId) REFERENCES User(id)
      );
    `);

    // 종료일 계산 (현재 날짜 + durationMonths)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + purchaseRequest.durationMonths);
    const endDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

    const assignmentId = generateId('assignment');
    await env.DB.prepare(`
      INSERT INTO bot_assignments (id, academyId, botId, endDate, isActive, createdBy)
      VALUES (?, ?, ?, ?, 1, ?)
    `).bind(
      assignmentId,
      purchaseRequest.academyId,
      purchaseRequest.botId,
      endDateStr,
      tokenData.email
    ).run();

    console.log('✅ 봇 할당 생성 완료:', {
      assignmentId,
      academyId: purchaseRequest.academyId,
      botId: purchaseRequest.botId,
      endDate: endDateStr
    });

    return new Response(JSON.stringify({
      success: true,
      message: "구매 요청이 승인되었습니다",
      assignmentId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("봇 구매 요청 승인 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "승인 처리 실패"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
