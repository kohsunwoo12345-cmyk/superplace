// API: Get Approved Sender Numbers
// GET /api/sender-numbers/approved

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

    // 사용자 정보 조회 (ID 또는 email로)
    let user = await db
      .prepare('SELECT id, email, approved_sender_numbers FROM users WHERE id = ?')
      .bind(tokenData.id)
      .first();

    if (!user) {
      // ID로 못 찾으면 email로 시도
      user = await db
        .prepare('SELECT id, email, approved_sender_numbers FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: true,
          senderNumbers: [],
          message: "사용자 정보를 찾을 수 없습니다." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // approved_sender_numbers 파싱
    const approvedNumbers = user.approved_sender_numbers;
    let senderNumbers: string[] = [];

    if (approvedNumbers) {
      // 쉼표로 구분된 경우
      senderNumbers = approvedNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n);
    }

    console.log(`✅ 승인된 발신번호 조회 - userId: ${user.id}, numbers: ${senderNumbers.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        senderNumbers,
        userId: user.id,
        email: user.email,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("승인된 발신번호 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "발신번호 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
