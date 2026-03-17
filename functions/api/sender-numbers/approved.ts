// API: Get Approved Sender Numbers
// GET /api/sender-numbers/approved

interface Env {
  DB: D1Database;
}

// 토큰 파싱 함수 (3개 또는 5개 파트 지원)
function parseToken(authHeader: string | null): { id: string; email: string; role: string; academyId?: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  // 3개 파트 토큰: ID|email|role
  // 5개 파트 토큰: ID|email|role|academyId|timestamp (신규 로그인)
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts.length >= 4 ? parts[3] : undefined
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

    // 사용자 정보 조회 - 다중 테이블 패턴 시도
    let user: any = null;
    
    // 패턴 1: User 테이블 (대문자) - email
    try {
      user = await db
        .prepare('SELECT id, email, approved_sender_numbers as approvedSenderNumbers FROM User WHERE email = ?')
        .bind(tokenData.email)
        .first();
      if (user) console.log('✅ User 테이블에서 발견');
    } catch (e) {
      console.log('⚠️ User 테이블 조회 실패');
    }

    // 패턴 2: users 테이블 (소문자) - email
    if (!user) {
      try {
        user = await db
          .prepare('SELECT id, email, approved_sender_numbers as approvedSenderNumbers FROM users WHERE email = ?')
          .bind(tokenData.email)
          .first();
        if (user) console.log('✅ users 테이블에서 발견');
      } catch (e) {
        console.log('⚠️ users 테이블 조회 실패');
      }
    }

    // 패턴 3: ID로 재시도 (User 테이블)
    if (!user) {
      try {
        user = await db
          .prepare('SELECT id, email, approved_sender_numbers as approvedSenderNumbers FROM User WHERE id = ?')
          .bind(tokenData.id)
          .first();
        if (user) console.log('✅ User 테이블에서 발견 (ID)');
      } catch (e) {
        console.log('⚠️ User 테이블 ID 조회 실패');
      }
    }

    // 패턴 4: ID로 재시도 (users 테이블)
    if (!user) {
      try {
        user = await db
          .prepare('SELECT id, email, approved_sender_numbers as approvedSenderNumbers FROM users WHERE id = ?')
          .bind(tokenData.id)
          .first();
        if (user) console.log('✅ users 테이블에서 발견 (ID)');
      } catch (e) {
        console.log('⚠️ users 테이블 ID 조회 실패');
      }
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
      approvedSenderNumbers: user.approvedSenderNumbers
    });

    // approvedSenderNumbers 파싱
    const approvedNumbers = user.approvedSenderNumbers;
    let senderNumbers: string[] = [];

    if (approvedNumbers) {
      // 쉼표로 구분된 경우
      senderNumbers = approvedNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n);
    }

    console.log(`✅ 승인된 발신번호 조회 완료:`, {
      userId: user.id,
      email: user.email,
      approvedNumbers: approvedNumbers,
      parsedNumbers: senderNumbers
    });

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
