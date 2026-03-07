// Admin API: Reject Sender Number Request
// POST /api/admin/sender-number-requests/reject

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

    // 관리자 권한 확인
    const user = await db
      .prepare('SELECT id, email, role FROM users WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return new Response(JSON.stringify({ error: "관리자 권한이 필요합니다." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const { requestId, reason } = body;

    if (!requestId || !reason) {
      return new Response(
        JSON.stringify({ error: "requestId와 reason이 필요합니다." }),
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

    // 반려 처리
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE sender_number_requests
      SET status = 'REJECTED', rejectedAt = ?, rejectedBy = ?, rejectionReason = ?, updatedAt = ?
      WHERE id = ?
    `).bind(now, user.id, reason, now, requestId).run();

    console.log('✅ 발신번호 등록 반려:', requestId, '사유:', reason);

    return new Response(
      JSON.stringify({
        success: true,
        message: "발신번호 등록이 반려되었습니다.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("발신번호 반려 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "발신번호 반려 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
