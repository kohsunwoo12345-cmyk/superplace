// 실제 발송 및 포인트 차감 테스트 API
// GET /api/debug/test-send-and-deduct?userId=1&email=wangholy1@naver.com&to=01085328739&from=01087399697

interface Env {
  DB: D1Database;
  SOLAPI_API_Key: string;
  'SOLAPI_API_Key ': string;
  SOLAPI_API_SECRET: string;
  SOLAPI_API_Secret: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || '1';
    const email = url.searchParams.get('email') || 'test@test.com';
    const to = url.searchParams.get('to') || '01012345678';
    const from = url.searchParams.get('from') || '01087399697';
    const text = '테스트 메시지입니다.';
    
    console.log('🧪 테스트 발송 시작:', { userId, email, to, from });
    
    // 1. 발송 전 포인트 확인
    const beforePoints = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM point_transactions WHERE userId = ?
    `).bind(userId).first();
    
    console.log('💰 발송 전 포인트:', beforePoints);
    
    // 2. 메시지 비용 계산 (SMS: 40P)
    const cost = 40;
    
    // 3. Solapi API 키 확인
    const envAny = env as any;
    const SOLAPI_API_KEY = (envAny['SOLAPI_API_Key '] || envAny['SOLAPI_API_Key'] || envAny.SOLAPI_API_Key || envAny.SOLAPI_API_KEY)?.trim();
    const SOLAPI_API_SECRET = (envAny.SOLAPI_API_SECRET || envAny.SOLAPI_API_Secret || envAny['SOLAPI_API_Secret'])?.trim();
    
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(JSON.stringify({
        error: 'Solapi API 키가 설정되지 않았습니다',
        keyExists: !!SOLAPI_API_KEY,
        secretExists: !!SOLAPI_API_SECRET,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Solapi 서명 생성
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15);
    const message = date + salt;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SOLAPI_API_SECRET);
    const messageData = encoder.encode(message);
    
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
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signatureHex}`;
    
    // 5. Solapi API 호출
    const solapiResponse = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        message: {
          to: to.replace(/-/g, ""),
          from: from.replace(/-/g, ""),
          text: text,
        },
      }),
    });

    const solapiResult = await solapiResponse.json();
    
    console.log('📬 Solapi 응답:', solapiResult);
    
    // 6. 성공 판정 (statusCode 2000~2999)
    const statusCodeNum = typeof solapiResult.statusCode === 'string' 
      ? parseInt(solapiResult.statusCode) 
      : solapiResult.statusCode;
    const isSuccess = solapiResponse.ok && statusCodeNum >= 2000 && statusCodeNum < 3000;
    
    console.log('✅ 성공 여부:', isSuccess);
    
    // 7. SMS 로그 저장
    await env.DB.prepare(`
      INSERT INTO sms_logs (userId, senderNumber, recipientNumber, content, status, statusMessage, studentId, studentName, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
      .bind(
        userId,
        from,
        to,
        text,
        isSuccess ? 'SUCCESS' : 'FAILED',
        isSuccess ? `Sent (${solapiResult.messageId})` : (solapiResult.errorMessage || JSON.stringify(solapiResult)),
        null,
        '테스트 수신자'
      )
      .run();
    
    console.log('📝 SMS 로그 저장 완료');
    
    // 8. 성공 시 포인트 차감
    if (isSuccess) {
      console.log(`💳 포인트 차감 중: ${cost}P`);
      
      await env.DB.prepare(`
        INSERT INTO point_transactions (userId, userEmail, amount, type, description, createdAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `)
        .bind(
          userId,
          email,
          -cost,
          'SMS_SEND',
          `[테스트] 문자 발송: ${to} - 테스트 수신자`
        )
        .run();
      
      console.log('✅ 포인트 차감 완료');
    }
    
    // 9. 발송 후 포인트 확인
    const afterPoints = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM point_transactions WHERE userId = ?
    `).bind(userId).first();
    
    console.log('💰 발송 후 포인트:', afterPoints);
    
    // 10. MessageSendHistory 저장
    try {
      await env.DB.prepare(`
        INSERT INTO MessageSendHistory (
          userId, messageType, senderNumber, recipientCount, recipients,
          messageContent, pointsUsed, pointCostPerMessage, successCount, failCount,
          status, sendResults, sentAt, scheduledAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
        .bind(
          userId,
          'SMS',
          from,
          1,
          JSON.stringify([{ to, studentName: '테스트 수신자' }]),
          text,
          isSuccess ? cost : 0,
          cost,
          isSuccess ? 1 : 0,
          isSuccess ? 0 : 1,
          isSuccess ? 'COMPLETED' : 'FAILED',
          JSON.stringify([{ to, studentName: '테스트 수신자', status: isSuccess ? 'SUCCESS' : 'FAILED', cost: isSuccess ? cost : 0 }]),
          new Date().toISOString(),
          null
        )
        .run();
      
      console.log('✅ 발송 내역 저장 완료');
    } catch (historyError: any) {
      console.error('⚠️ 발송 내역 저장 실패:', historyError.message);
    }
    
    return new Response(JSON.stringify({
      success: true,
      test: {
        userId,
        email,
        to,
        from,
        cost,
      },
      solapi: {
        success: isSuccess,
        statusCode: solapiResult.statusCode,
        messageId: solapiResult.messageId,
        statusMessage: solapiResult.statusMessage,
      },
      points: {
        before: beforePoints?.total || 0,
        after: afterPoints?.total || 0,
        deducted: isSuccess ? cost : 0,
      },
      logs: {
        smsLogSaved: true,
        pointTransactionSaved: isSuccess,
        historySaved: true,
      },
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ 테스트 실패:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
