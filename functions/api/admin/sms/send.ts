// SMS 발송 API with Solapi Integration
// POST /api/admin/sms/send

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Solapi SMS 발송 함수 (인라인)
async function sendViaSolapi(apiKey: string, apiSecret: string, from: string, to: string, text: string) {
  const url = 'https://api.solapi.com/messages/v4/send';
  const timestamp = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  
  // HMAC-SHA256 서명 생성
  const message = timestamp + salt;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  
  const byteLength = new Blob([text]).size;
  const type = byteLength > 90 ? 'LMS' : 'SMS';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({
      messages: [{
        to: to.replace(/-/g, ''),
        from: from.replace(/-/g, ''),
        text,
        type,
      }],
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.errorMessage || 'SMS 발송 실패');
  }
  
  return { success: true, messageId: data.groupId };
}

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    let userId: string;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.userId || decoded.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 사용자 권한 확인
    const user = await db
      .prepare('SELECT role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { senderId, receivers, message, reserveTime } = body;

    if (!senderId || !receivers || receivers.length === 0 || !message) {
      return new Response(
        JSON.stringify({ error: '발신번호, 수신자, 메시지는 필수입니다' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 메시지 타입 결정 (SMS: 90바이트 이하, LMS: 90바이트 초과)
    const byteSize = new Blob([message]).size;
    const messageType = byteSize > 90 ? 'LMS' : 'SMS';
    const costPerMessage = messageType === 'LMS' ? 50 : 20;
    const totalCost = costPerMessage * receivers.length;

    // 포인트 잔액 확인
    const balanceResult = await db
      .prepare('SELECT balance FROM SMSBalance WHERE id = ?')
      .bind('default')
      .first();

    const currentBalance = balanceResult?.balance || 0;

    if (currentBalance < totalCost) {
      return new Response(
        JSON.stringify({
          error: '포인트가 부족합니다',
          required: totalCost,
          current: currentBalance,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 발신번호 조회
    const sender = await db
      .prepare('SELECT * FROM SMSSender WHERE phone_number = ?')
      .bind(senderId)
      .first();

    if (!sender) {
      return new Response(JSON.stringify({ error: '등록되지 않은 발신번호입니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const logIds: string[] = [];
    let successCount = 0;
    const failedReceivers: string[] = [];

    // 각 수신자에게 발송
    for (const receiver of receivers) {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Solapi를 통한 SMS 발송 (정확한 환경 변수명 사용)
        const apiKey = env.SOLAPI_API_Key;
        const apiSecret = env.SOLAPI_API_Secret;
        
        if (!apiKey || !apiSecret) {
          throw new Error('Solapi credentials not configured');
        }
        
        await sendViaSolapi(apiKey, apiSecret, sender.phone_number, receiver.phone, message);
        
        // SMS 로그 저장 - 성공
        await db
          .prepare(
            `INSERT INTO SMSLog (
              id, sender_id, sender_phone, receiver_name, receiver_phone,
              message, message_type, status, cost, sent_at, createdById, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            logId,
            sender.id,
            sender.phone_number,
            receiver.name,
            receiver.phone,
            message,
            messageType,
            'success',
            costPerMessage,
            reserveTime || now,
            userId,
            now
          )
          .run();

        logIds.push(logId);
        successCount++;
      } catch (error: any) {
        console.error(`Failed to send to ${receiver.phone}:`, error);
        
        // SMS 로그 저장 - 실패
        await db
          .prepare(
            `INSERT INTO SMSLog (
              id, sender_id, sender_phone, receiver_name, receiver_phone,
              message, message_type, status, cost, error_message, sent_at, createdById, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            logId,
            sender.id,
            sender.phone_number,
            receiver.name,
            receiver.phone,
            message,
            messageType,
            'failed',
            0,
            error.message,
            now,
            userId,
            now
          )
          .run();
        
        failedReceivers.push(receiver.name);
      }
    }

    // 포인트 차감 (성공한 발송에 대해서만)
    const actualCost = costPerMessage * successCount;
    const newBalance = currentBalance - actualCost;
    await db
      .prepare(
        `UPDATE SMSBalance 
         SET balance = ?, total_used = total_used + ?, lastUsedAt = ?, updatedAt = ?
         WHERE id = ?`
      )
      .bind(newBalance, actualCost, now, now, 'default')
      .run();

    // 거래 내역 기록
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(
        `INSERT INTO SMSBalanceTransaction (
          id, type, amount, balance_after, description, createdById, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        transactionId,
        'use',
        actualCost,
        newBalance,
        `SMS ${successCount}건 발송`,
        userId,
        now
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount}건의 문자가 발송되었습니다${failedReceivers.length > 0 ? ` (${failedReceivers.length}건 실패)` : ''}`,
        sent: successCount,
        failed: failedReceivers.length,
        failedReceivers,
        cost: actualCost,
        balance: newBalance,
        logIds,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('SMS 발송 오류:', error);
    return new Response(
      JSON.stringify({ error: 'SMS 발송 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
