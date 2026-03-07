// Admin API: Sender Number Requests List
// GET /api/admin/sender-number-requests

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

export async function onRequestGet(context: { request: Request; env: Env }) {
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

    // 모든 발신번호 신청 조회
    const requests = await db
      .prepare('SELECT * FROM sender_number_requests ORDER BY createdAt DESC')
      .all();

    const results = (requests.results || []).map((req: any) => ({
      id: req.id,
      userId: req.userId,
      userName: req.userName,
      companyName: req.companyName,
      businessNumber: req.businessNumber,
      address: req.address,
      senderNumbers: req.senderNumbers,
      representativeName: req.representativeName,
      phone: req.phone,
      email: req.email,
      status: req.status,
      fileUrls: {
        telecomCertificate: req.telecomCertificateUrl,
        businessRegistration: req.businessRegistrationUrl,
        serviceAgreement: req.serviceAgreementUrl,
        privacyAgreement: req.privacyAgreementUrl,
      },
      createdAt: req.createdAt,
      approvedAt: req.approvedAt,
      rejectedAt: req.rejectedAt,
      rejectionReason: req.rejectionReason,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        requests: results,
        total: results.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("발신번호 신청 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "발신번호 신청 목록 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
