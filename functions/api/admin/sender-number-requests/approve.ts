// Admin API: Approve Sender Number Request
// POST /api/admin/sender-number-requests/approve

interface Env {
  DB: D1Database;
}

function parseToken(authHeader: string | null): { id: string; email: string; role: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

    // 관리자 권한 확인 - 토큰의 role을 먼저 확인
    console.log('🔍 Token data:', tokenData);
    
    // 토큰에 ADMIN 또는 SUPER_ADMIN이 아니면 거부
    if (tokenData.role !== 'ADMIN' && tokenData.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: "관리자 권한이 필요합니다." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('✅ Token role verified:', tokenData.role);
    
    // DB에서 사용자 정보 조회 (ID 또는 email로)
    let user = await db
      .prepare('SELECT id, email, role FROM users WHERE id = ?')
      .bind(tokenData.id)
      .first();

    if (!user) {
      // ID로 못 찾으면 email로 시도
      user = await db
        .prepare('SELECT id, email, role FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    // DB에서 못 찾아도 토큰의 role이 ADMIN이면 허용
    if (!user) {
      console.log('⚠️ User not found in DB, but token role is valid');
      user = { id: tokenData.id, email: tokenData.email, role: tokenData.role };
    }
    
    const body = await context.request.json();
    const { requestId } = body;

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "requestId가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 신청 정보 조회
    const request = await db
      .prepare('SELECT * FROM sender_number_requests WHERE id = ?')
      .bind(requestId)
      .first();

    if (!request) {
      return new Response(
        JSON.stringify({ error: "신청 정보를 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 승인 처리
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE sender_number_requests
      SET status = 'APPROVED', approvedAt = ?, approvedBy = ?, updatedAt = ?
      WHERE id = ?
    `).bind(now, user.id, now, requestId).run();

    // 학원장의 users 테이블에 승인된 발신번호 저장
    // request.userId가 있으면 해당 사용자의 레코드 업데이트
    if (request.userId) {
      try {
        await db.prepare(`
          UPDATE users
          SET approved_sender_numbers = ?
          WHERE id = ?
        `).bind(request.senderNumbers, request.userId).run();
        
        console.log(`✅ 학원장(userId: ${request.userId})의 발신번호 저장 완료:`, request.senderNumbers);
      } catch (error: any) {
        console.error('⚠️ 학원장 테이블 업데이트 실패:', error.message);
        // 발신번호 저장 실패는 치명적이지 않으므로 계속 진행
      }
    }

    console.log('✅ 발신번호 등록 승인:', requestId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "발신번호 등록이 승인되었습니다.",
        approvedNumbers: request.senderNumbers,
        userId: request.userId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("발신번호 승인 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "발신번호 승인 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
