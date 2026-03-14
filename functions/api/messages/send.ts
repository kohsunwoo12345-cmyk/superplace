import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
}

interface RecipientMapping {
  studentId: string;
  studentName: string;
  parentPhone: string;
  landingPageUrl: string;
  grade?: string;
  class?: string;
}

// JWT 토큰에서 사용자 정보 추출
async function getUserFromToken(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

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

// SMS 발송 (Solapi)
async function sendSMS(
  apiKey: string,
  apiSecret: string,
  from: string,
  to: string,
  text: string
): Promise<any> {
  const timestamp = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const signature = await generateHmacSignature(apiSecret, timestamp + salt);

  const response = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`
    },
    body: JSON.stringify({
      messages: [{
        to: to.replace(/-/g, ''),
        from: from.replace(/-/g, ''),
        text: text,
        type: text.length > 90 ? 'LMS' : 'SMS'
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Solapi SMS error:', errorText);
    throw new Error(`SMS 발송 실패: ${errorText}`);
  }

  return await response.json();
}

// 카카오 알림톡 발송 (Solapi)
async function sendKakao(
  apiKey: string,
  apiSecret: string,
  from: string,
  to: string,
  templateCode: string,
  text: string
): Promise<any> {
  const timestamp = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const signature = await generateHmacSignature(apiSecret, timestamp + salt);

  const response = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`
    },
    body: JSON.stringify({
      messages: [{
        to: to.replace(/-/g, ''),
        from: from.replace(/-/g, ''),
        text: text,
        type: 'ATA', // 알림톡
        kakaoOptions: {
          pfId: templateCode || from.replace(/-/g, ''),
          templateId: 'default'
        }
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Solapi Kakao error:', errorText);
    // 카카오 실패 시 SMS로 폴백
    console.log('카카오 발송 실패, SMS로 폴백');
    return await sendSMS(apiKey, apiSecret, from, to, text);
  }

  return await response.json();
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token, env.JWT_SECRET);

    const body = await request.json() as any;
    const {
      messageType, // SMS, KAKAO
      senderNumber,
      kakaoChannelId,
      messageTitle,
      messageContent,
      recipients, // RecipientMapping[]
      landingPageId,
      scheduledAt
    } = body;

    // 입력 검증
    if (!messageType || !messageContent || !recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Required fields missing',
        message: '필수 필드가 누락되었습니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SMS인 경우 발신번호 검증
    if (messageType === 'SMS' && !senderNumber) {
      return new Response(JSON.stringify({ 
        error: 'Sender number required',
        message: 'SMS 발송을 위해서는 발신번호가 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 카카오인 경우 채널 ID 검증
    if (messageType === 'KAKAO' && !kakaoChannelId) {
      return new Response(JSON.stringify({ 
        error: 'Kakao channel required',
        message: '카카오톡 발송을 위해서는 카카오 채널이 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 포인트 비용 계산
    const SMS_COST = 20;
    const KAKAO_COST = 15;
    const costPerMessage = messageType === 'SMS' ? SMS_COST : KAKAO_COST;
    const totalCost = recipients.length * costPerMessage;

    // 사용자 포인트 확인
    const userResult = await env.DB.prepare(`
      SELECT points FROM users WHERE id = ?
    `).bind(user.id || user.userId).first();

    const userPoints = (userResult?.points as number) || 0;

    if (userPoints < totalCost) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient points',
        message: `포인트가 부족합니다. 필요: ${totalCost}P, 보유: ${userPoints}P`,
        requiredPoints: totalCost,
        currentPoints: userPoints
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 발신번호 또는 카카오 채널 검증
    let fromNumber = '';
    let kakaoChannelInfo: any = null;

    if (messageType === 'SMS') {
      // 사용자가 등록한 발신번호인지 확인
      const senderNumberResult = await env.DB.prepare(`
        SELECT phoneNumber, status FROM SenderNumber 
        WHERE userId = ? AND phoneNumber = ? AND status = 'APPROVED'
      `).bind(user.id || user.userId, senderNumber).first();

      if (!senderNumberResult) {
        return new Response(JSON.stringify({ 
          error: 'Invalid sender number',
          message: '등록되지 않았거나 승인되지 않은 발신번호입니다.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      fromNumber = senderNumber;
    } else if (messageType === 'KAKAO') {
      // 사용자가 등록한 카카오 채널인지 확인
      const channelResult = await env.DB.prepare(`
        SELECT channelId, phoneNumber, channelName, status, solapiChannelId 
        FROM KakaoChannel 
        WHERE userId = ? AND channelId = ? AND status = 'APPROVED'
      `).bind(user.id || user.userId, kakaoChannelId).first();

      if (!channelResult) {
        return new Response(JSON.stringify({ 
          error: 'Invalid Kakao channel',
          message: '등록되지 않았거나 승인되지 않은 카카오 채널입니다.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      kakaoChannelInfo = channelResult;
      fromNumber = channelResult.phoneNumber as string;
    }

    console.log(`📤 메시지 발송 시작: ${messageType}, 수신자 ${recipients.length}명, 발신: ${fromNumber}`);

    // Solapi API 키 확인
    const apiKey = env.SOLAPI_API_KEY;
    const apiSecret = env.SOLAPI_API_SECRET;

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ 
        error: 'API configuration error',
        message: 'Solapi API 키가 설정되지 않았습니다.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 메시지 발송
    let successCount = 0;
    let failCount = 0;
    const sendResults: any[] = [];

    for (const recipient of recipients) {
      try {
        // 변수 치환
        let finalMessage = messageContent
          .replace(/\{\{학생명\}\}/g, recipient.studentName)
          .replace(/\{\{학부모명\}\}/g, recipient.studentName + ' 학부모님')
          .replace(/\{\{URL\}\}/g, recipient.landingPageUrl || '');

        let result;
        if (messageType === 'SMS') {
          result = await sendSMS(apiKey, apiSecret, fromNumber, recipient.parentPhone, finalMessage);
        } else {
          // 카카오 발송 시 채널 ID 사용
          const channelPfId = kakaoChannelInfo?.solapiChannelId || kakaoChannelInfo?.channelId;
          result = await sendKakao(apiKey, apiSecret, fromNumber, recipient.parentPhone, channelPfId, finalMessage);
        }

        successCount++;
        sendResults.push({
          ...recipient,
          status: 'success',
          result
        });
        console.log(`✅ 발송 성공: ${recipient.studentName} (${recipient.parentPhone})`);
      } catch (error: any) {
        failCount++;
        sendResults.push({
          ...recipient,
          status: 'failed',
          error: error.message
        });
        console.error(`❌ 발송 실패: ${recipient.studentName} (${recipient.parentPhone})`, error);
      }
    }

    // 포인트 차감
    await env.DB.prepare(`
      UPDATE users SET points = points - ? WHERE id = ?
    `).bind(totalCost, user.id || user.userId).run();

    console.log(`💰 포인트 차감: ${totalCost}P (잔액: ${userPoints - totalCost}P)`);

    // 발송 이력 저장
    const historyId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO MessageSendHistory (
        id, userId, userName, messageType, senderNumber,
        recipientCount, recipients, messageTitle, messageContent,
        landingPageTemplate, pointsUsed, pointCostPerMessage,
        successCount, failCount, status, sendResults,
        sentAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      historyId,
      user.id || user.userId,
      user.name || user.userName,
      messageType,
      fromNumber,
      recipients.length,
      JSON.stringify(recipients),
      messageTitle || '',
      messageContent,
      landingPageId || null,
      totalCost,
      costPerMessage,
      successCount,
      failCount,
      successCount > 0 ? 'COMPLETED' : 'FAILED',
      JSON.stringify(sendResults),
      now,
      now,
      now
    ).run();

    console.log(`✅ 메시지 발송 완료: 성공 ${successCount}건, 실패 ${failCount}건`);

    return new Response(JSON.stringify({ 
      success: true,
      successCount,
      failCount,
      totalCost,
      remainingPoints: userPoints - totalCost,
      historyId,
      message: `발송 완료! 성공: ${successCount}건, 실패: ${failCount}건`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Message send failed:', error);
    return new Response(JSON.stringify({ 
      error: 'Send failed',
      message: error.message || '메시지 발송에 실패했습니다.',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
