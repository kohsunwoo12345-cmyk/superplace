// 반별 학부모 일괄 발송 API
// POST /api/admin/sms/send-by-class

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Solapi SMS 발송 함수 (인라인)
async function sendViaSolapi(apiKey: string, apiSecret: string, from: string, to: string, text: string) {
  const url = 'https://api.solapi.com/messages/v4/send';
  const timestamp = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  
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
      .prepare('SELECT role FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTOR' && user.role !== 'ADMIN')) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { classId, message, senderId, includeLandingPage } = body;

    if (!classId || !message || !senderId) {
      return new Response(
        JSON.stringify({ error: '반, 메시지, 발신번호는 필수입니다' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 발신번호 확인
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

    // 반에 속한 학생들 조회
    const students = await db
      .prepare(`
        SELECT DISTINCT
          u.id,
          u.name,
          u.parentPhone
        FROM User u
        INNER JOIN ClassStudent cs ON cs.studentId = u.id
        WHERE cs.classId = ? AND u.role = 'STUDENT'
      `)
      .bind(classId)
      .all();

    if (!students.results || students.results.length === 0) {
      return new Response(
        JSON.stringify({ error: '해당 반에 학생이 없습니다' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 학부모 정보 조회 및 중복 제거
    const parentPhones = new Map<string, { name: string; studentName: string; studentId: string }>();

    for (const student of students.results) {
      // StudentParent에서 주 연락처 학부모 조회
      const parents = await db
        .prepare(`
          SELECT p.phone, p.name
          FROM Parent p
          INNER JOIN StudentParent sp ON sp.parentId = p.id
          WHERE sp.studentId = ? AND sp.isPrimary = 1
        `)
        .bind(student.id)
        .first();

      const phone = parents?.phone || student.parentPhone;
      const parentName = parents?.name || '학부모';

      if (phone && !parentPhones.has(phone)) {
        parentPhones.set(phone, {
          name: parentName,
          studentName: student.name as string,
          studentId: student.id as string,
        });
      }
    }

    if (parentPhones.size === 0) {
      return new Response(
        JSON.stringify({ error: '학부모 연락처가 없습니다' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Solapi 설정 조회
    const solapiConfig = await db
      .prepare('SELECT * FROM SolapiConfig WHERE id = ? AND isActive = 1')
      .bind('default')
      .first();

    const now = new Date().toISOString();
    const logIds: string[] = [];
    const failedReceivers: string[] = [];
    let successCount = 0;

    // 메시지 타입 결정
    const byteSize = new Blob([message]).size;
    const messageType = byteSize > 90 ? 'LMS' : 'SMS';
    const costPerMessage = messageType === 'LMS' ? 50 : 20;

    // 각 학부모에게 발송
    for (const [phone, info] of parentPhones) {
      let finalMessage = message;

      // 랜딩페이지 링크 포함 여부
      if (includeLandingPage) {
        // 학생의 랜딩페이지 조회
        const landingPage = await db
          .prepare('SELECT slug FROM LandingPage WHERE studentId = ? AND isActive = 1 LIMIT 1')
          .bind(info.studentId)
          .first();

        if (landingPage) {
          const landingUrl = `https://superplace-study.vercel.app/l/${landingPage.slug}`;
          finalMessage += `\n\n📊 학습 리포트: ${landingUrl}`;
        }
      }

      // 학생 이름 치환
      finalMessage = finalMessage.replace(/\{학생명\}/g, info.studentName);
      finalMessage = finalMessage.replace(/\{name\}/g, info.studentName);

      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let status = 'pending';
      let errorMessage = null;

      // 실제 SMS 발송
      if (solapiConfig && solapiConfig.api_key && solapiConfig.api_secret) {
        try {
          await sendViaSolapi(
            solapiConfig.api_key as string,
            solapiConfig.api_secret as string,
            sender.phone_number as string,
            phone,
            finalMessage
          );
          status = 'success';
          successCount++;
        } catch (error: any) {
          status = 'failed';
          errorMessage = error.message || '발송 실패';
          failedReceivers.push(`${info.name} (${info.studentName})`);
          console.error(`SMS 발송 실패 (${info.name}):`, error);
        }
      } else {
        status = 'success';
        successCount++;
      }

      // SMS 로그 저장
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
          `${info.name} (${info.studentName})`,
          phone,
          finalMessage,
          messageType,
          status,
          costPerMessage,
          errorMessage,
          now,
          userId,
          now
        )
        .run();

      logIds.push(logId);
    }

    const totalCost = costPerMessage * successCount;

    // 포인트 차감
    const balanceResult = await db
      .prepare('SELECT balance FROM SMSBalance WHERE id = ?')
      .bind('default')
      .first();

    const currentBalance = balanceResult?.balance || 0;
    const newBalance = currentBalance - totalCost;

    await db
      .prepare(
        `UPDATE SMSBalance 
         SET balance = ?, total_used = total_used + ?, lastUsedAt = ?, updatedAt = ?
         WHERE id = ?`
      )
      .bind(newBalance, totalCost, now, now, 'default')
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount}명의 학부모에게 문자가 발송되었습니다${failedReceivers.length > 0 ? ` (${failedReceivers.length}건 실패)` : ''}`,
        totalRecipients: parentPhones.size,
        sent: successCount,
        failed: failedReceivers.length,
        failedReceivers,
        cost: totalCost,
        balance: newBalance,
        logIds,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('반별 SMS 발송 오류:', error);
    return new Response(
      JSON.stringify({ error: '반별 SMS 발송 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
