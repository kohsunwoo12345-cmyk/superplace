// Send Bulk SMS Messages
// POST /api/messages/send-bulk
// Body: { messages: Array<{ to, from, text, studentId?, studentName? }> }

interface Env {
  DB: D1Database;
  SOLAPI_API_Key: string;  // 대소문자 정확히
  SOLAPI_API_Secret: string;  // 대소문자 정확히
}

interface Message {
  to: string;
  from: string;
  text: string;
  studentId?: string;
  studentName?: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  const { request, env } = context;

  try {
    // 토큰 검증
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "인증이 필요합니다" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const [userIdStr, email, role] = token.split("|");
    const userId = parseInt(userIdStr);

    if (!userId || isNaN(userId)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 토큰입니다" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { messages } = body as { messages: Message[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "발송할 메시지가 없습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 메시지별 비용 계산 (문자 길이에 따라)
    const calculateMessageCost = (text: string): number => {
      const byteLength = new TextEncoder().encode(text).length;
      
      if (byteLength <= 90) {
        // 단문 SMS (90 바이트 = 한글 45자, 영어 90자)
        return 40;
      } else if (byteLength <= 2000) {
        // 장문 LMS (2,000 바이트 = 한글 1,000자, 영어 2,000자)
        return 95;
      } else {
        // 초과 시 LMS로 처리
        return 95;
      }
    };

    // 각 메시지별 비용 계산
    const messageCosts = messages.map(msg => calculateMessageCost(msg.text));
    const totalCost = messageCosts.reduce((sum, cost) => sum + cost, 0);

    console.log(`📨 문자 발송 요청: ${messages.length}건`);
    console.log(`💰 예상 비용: ${totalCost}P (SMS: 40P, LMS: 95P, MMS: 220P)`);
    console.log(`👤 사용자: userId=${userId}, email=${email}`);

    // 포인트 조회 (point_transactions 테이블 사용 - 이메일 기준)
    let currentPoints = 0;
    try {
      const pointResult = await env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM point_transactions
        WHERE userEmail = ?
      `).bind(email).all();
      
      const firstRow = pointResult.results?.[0];
      currentPoints = (firstRow as any)?.total || 0;
      console.log(`💳 현재 포인트 (by email): ${currentPoints}P`);
    } catch (error) {
      console.warn("⚠️ point_transactions 조회 실패, users 테이블 확인", error);
      
      // Fallback: users 테이블에서 조회
      try {
        const user = await env.DB.prepare("SELECT points FROM users WHERE id = ?")
          .bind(userId)
          .first();
        currentPoints = (user?.points as number) || 0;
        console.log(`💳 현재 포인트 (users): ${currentPoints}P`);
      } catch (fallbackError) {
        console.warn("⚠️ users 테이블도 실패, 포인트 0으로 처리", fallbackError);
      }
    }

    // 포인트 부족 확인
    if (currentPoints < totalCost) {
      return new Response(
        JSON.stringify({
          error: "포인트가 부족합니다",
          required: totalCost,
          current: currentPoints,
          shortage: totalCost - currentPoints,
          message: `발송 비용 ${totalCost}P가 필요하지만 ${currentPoints}P만 보유중입니다. ${totalCost - currentPoints}P를 충전해주세요.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Solapi 설정 (대소문자 정확히)
    const SOLAPI_API_KEY = env.SOLAPI_API_Key?.trim();
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret?.trim();

    const keyDebugInfo = {
      keyExists: !!SOLAPI_API_KEY,
      secretExists: !!SOLAPI_API_SECRET,
      keyLength: SOLAPI_API_KEY?.length || 0,
      secretLength: SOLAPI_API_SECRET?.length || 0,
      keyHasSpaces: env.SOLAPI_API_Key?.includes(' ') || false,
      secretHasSpaces: env.SOLAPI_API_Secret?.includes(' ') || false,
      keyTrimmed: env.SOLAPI_API_Key?.trim().length === env.SOLAPI_API_Key?.length,
      secretTrimmed: env.SOLAPI_API_Secret?.trim().length === env.SOLAPI_API_Secret?.length,
    };
    
    console.log('🔑 Solapi 키 확인:', keyDebugInfo);

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      console.warn("⚠️ Solapi 키가 설정되지 않았습니다. 테스트 모드로 동작합니다.");
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Solapi API 키가 설정되지 않았습니다",
          mode: 'TEST',
          debug: {
            message: 'Cloudflare 환경변수를 확인하세요',
            requiredVars: ['SOLAPI_API_Key', 'SOLAPI_API_Secret'],
            keyDebugInfo,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 실제 Solapi 발송
    console.log('📤 Solapi 실제 발송 시작...');
    
    // Solapi REST API 인증을 위한 HMAC 서명 생성 (Cloudflare Workers 환경)
    async function createSolapiSignature(apiSecret: string) {
      const date = new Date().toISOString();
      const salt = crypto.randomUUID();
      
      // Solapi 서명 데이터 형식: date + salt
      const data = date + salt;
      
      console.log('🔐 서명 생성:', {
        date,
        salt,
        data,
        secretLength: apiSecret?.length,
      });
      
      // HMAC-SHA256 서명 생성 (crypto.subtle 사용)
      const encoder = new TextEncoder();
      const keyData = encoder.encode(apiSecret);
      const messageData = encoder.encode(data);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        messageData
      );
      
      // ArrayBuffer를 hex 문자열로 변환
      const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      console.log('✅ 서명 생성 완료:', {
        signatureLength: signatureHex.length,
        signaturePreview: signatureHex.substring(0, 16) + '...',
      });
      
      return { signature: signatureHex, date, salt };
    }
    
    const results = await Promise.allSettled(
      messages.map(async (message) => {
        try {
          // Solapi API 인증 정보 생성
          const { signature, date, salt } = await createSolapiSignature(SOLAPI_API_SECRET);
          
          const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
          
          console.log('🔐 Solapi 요청:', {
            to: message.to,
            from: message.from,
            apiKeyPreview: SOLAPI_API_KEY?.substring(0, 8) + '...',
            authHeaderLength: authHeader.length,
          });
          
          const response = await fetch("https://api.solapi.com/messages/v4/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": authHeader,
            },
            body: JSON.stringify({
              message: {
                to: message.to.replace(/-/g, ""),
                from: message.from.replace(/-/g, ""),
                text: message.text,
              },
            }),
          });

          const result = await response.json();
          
          console.log('📬 Solapi 응답:', {
            status: response.status,
            ok: response.ok,
            result,
          });

          // DB에 로그 저장
          await env.DB.prepare(`
            INSERT INTO sms_logs (userId, senderNumber, recipientNumber, content, status, statusMessage, studentId, studentName, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
            .bind(
              userId,
              message.from,
              message.to,
              message.text,
              response.ok ? 'SUCCESS' : 'FAILED',
              response.ok ? 'Sent' : (result.errorMessage || result.error || JSON.stringify(result)),
              message.studentId || null,
              message.studentName || null
            )
            .run();

          if (!response.ok) {
            throw new Error(`Solapi Error: ${result.errorMessage || result.error || JSON.stringify(result)}`);
          }

          return { success: true, message };
        } catch (error: any) {
          // 실패 로그 저장
          await env.DB.prepare(`
            INSERT INTO sms_logs (userId, senderNumber, recipientNumber, content, status, statusMessage, studentId, studentName, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
            .bind(
              userId,
              message.from,
              message.to,
              message.text,
              'FAILED',
              error.message,
              message.studentId || null,
              message.studentName || null
            )
            .run();

          return { success: false, message, error: error.message };
        }
      })
    );

    // 결과 집계
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failCount = results.length - successCount;

    // 성공한 메시지만 포인트 차감 (이메일 기준)
    let actualCost = 0;
    try {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "fulfilled" && result.value.success) {
          const cost = messageCosts[i];
          actualCost += cost;
          
          const message = messages[i];
          await env.DB.prepare(`
            INSERT INTO point_transactions (userId, userEmail, amount, type, description, createdAt)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `)
            .bind(
              userId,
              email,
              -cost, // 음수로 차감
              'SMS_SEND',
              `문자 발송: ${message.to} - ${message.studentName || '수신자'}`
            )
            .run();
        }
      }
      
      console.log(`✅ 포인트 차감 완료: ${actualCost}P (성공 ${successCount}건)`);
    } catch (error) {
      console.warn("⚠️ 포인트 차감 실패", error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        successCount,
        failCount,
        totalCost: actualCost,
        message: `${successCount}건 발송 완료, ${failCount}건 실패`,
        pointsDeducted: actualCost,
        remainingPoints: currentPoints - actualCost,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("대량 발송 실패:", error);
    return new Response(
      JSON.stringify({
        error: "발송 실패",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
