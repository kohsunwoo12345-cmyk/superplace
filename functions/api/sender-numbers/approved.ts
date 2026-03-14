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

    console.log('🔍 발신번호 조회 시작 - tokenData:', {
      id: tokenData.id,
      email: tokenData.email,
      role: tokenData.role
    });

    // userId를 문자열로 변환
    const userIdStr = String(tokenData.id);

    // 사용자 정보 조회 (User 테이블 먼저, 없으면 users 테이블)
    let user = await db
      .prepare('SELECT id, email, approvedSenderNumbers as approved_sender_numbers FROM User WHERE id = ?')
      .bind(userIdStr)
      .first();

    console.log('📊 User 테이블 조회 결과 (id):', user);

    if (!user) {
      // User 테이블에 없으면 email로 시도
      user = await db
        .prepare('SELECT id, email, approvedSenderNumbers as approved_sender_numbers FROM User WHERE email = ?')
        .bind(tokenData.email)
        .first();
      
      console.log('📊 User 테이블 조회 결과 (email):', user);
    }

    if (!user) {
      // User 테이블에 없으면 users 테이블 시도 (ID)
      user = await db
        .prepare('SELECT id, email, approved_sender_numbers FROM users WHERE id = ?')
        .bind(userIdStr)
        .first();
      
      console.log('📊 users 테이블 조회 결과 (id):', user);
    }

    if (!user) {
      // users 테이블에서 email로 시도
      user = await db
        .prepare('SELECT id, email, approved_sender_numbers FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
      
      console.log('📊 users 테이블 조회 결과 (email):', user);
    }

    if (!user) {
      console.log('⚠️ 사용자를 찾을 수 없음:', tokenData.email);
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
    
    console.log('✅ 사용자 찾음:', {
      id: user.id,
      email: user.email,
      approved_sender_numbers: user.approved_sender_numbers
    });

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
