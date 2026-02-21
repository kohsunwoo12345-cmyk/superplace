// Cloudflare Pages Function: POST /api/kakao/send-alimtalk
// 카카오 알림톡 발송 (Solapi API 연동)

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
}

interface RecipientMapping {
  phone: string;
  name: string;
  studentId?: string;
  studentName?: string;
  variables?: { [key: string]: string };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // 간단한 토큰 검증
    if (!token || token.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { channelId, templateId, templateCode, recipients } = body;

    // 필수 파라미터 검증
    if (!channelId || !templateId || !recipients || !Array.isArray(recipients)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Solapi API 키 확인
    const SOLAPI_API_KEY = env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(JSON.stringify({ error: 'Solapi API credentials not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 사용자 정보 가져오기 (토큰에서 추출 - 간단한 버전)
    // 실제로는 JWT 디코딩 필요
    const userQuery = await env.DB.prepare(
      'SELECT id, name, points FROM User WHERE id = ? LIMIT 1'
    ).bind(1).first(); // 임시로 ID 1 사용

    if (!userQuery) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = userQuery.id;
    const userName = userQuery.name;
    const userPoints = userQuery.points || 0;

    // 포인트 계산
    const KAKAO_COST = 15;
    const totalCost = recipients.length * KAKAO_COST;

    // 포인트 잔액 확인
    if (userPoints < totalCost) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient points',
        required: totalCost,
        current: userPoints
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Solapi HMAC 서명 생성
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15);
    const signature = await generateHmacSignature(SOLAPI_API_SECRET, date + salt);

    // 발송 결과 저장
    let successCount = 0;
    let failCount = 0;
    const sendResults: any[] = [];

    // 각 수신자에게 발송
    for (const recipient of recipients) {
      try {
        const normalizedPhone = recipient.phone.replace(/[^0-9]/g, '');

        // 템플릿 변수 준비
        const variables = recipient.variables || {};

        // Solapi API 호출 - 카카오 알림톡 발송
        const solapiPayload = {
          message: {
            to: normalizedPhone,
            from: '발신번호', // 실제로는 채널에 등록된 발신번호 사용
            kakaoOptions: {
              pfId: channelId, // 카카오 채널 ID
              templateId: templateCode || templateId, // 템플릿 코드
              variables: variables, // 템플릿 변수
              disableSms: false // SMS 대체 발송 허용
            }
          }
        };

        const solapiResponse = await fetch('https://api.solapi.com/messages/v4/send', {
          method: 'POST',
          headers: {
            'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(solapiPayload)
        });

        if (solapiResponse.ok) {
          const solapiData = await solapiResponse.json();
          successCount++;
          sendResults.push({
            phone: recipient.phone,
            name: recipient.name,
            status: 'SENT',
            messageId: solapiData.messageId
          });
        } else {
          const errorText = await solapiResponse.text();
          failCount++;
          sendResults.push({
            phone: recipient.phone,
            name: recipient.name,
            status: 'FAILED',
            error: errorText
          });
        }
      } catch (error: any) {
        failCount++;
        sendResults.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    // 포인트 차감
    const pointsDeducted = successCount * KAKAO_COST;
    await env.DB.prepare(
      'UPDATE User SET points = points - ? WHERE id = ?'
    ).bind(pointsDeducted, userId).run();

    // 발송 이력 저장
    const historyId = `KAKAO_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await env.DB.prepare(`
      INSERT INTO MessageSendHistory (
        id, userId, userName, messageType, templateId,
        recipientCount, recipients, totalCost, pointsDeducted,
        successCount, failCount, status, sentAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      historyId,
      userId,
      userName,
      'KAKAO',
      templateId,
      recipients.length,
      JSON.stringify(recipients),
      totalCost,
      pointsDeducted,
      successCount,
      failCount,
      successCount > 0 ? 'SENT' : 'FAILED',
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      successCount,
      failCount,
      totalRecipients: recipients.length,
      pointsDeducted,
      remainingPoints: userPoints - pointsDeducted,
      results: sendResults
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error sending Kakao Alimtalk:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send Kakao Alimtalk',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// HMAC-SHA256 서명 생성
async function generateHmacSignature(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
