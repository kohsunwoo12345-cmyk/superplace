/**
 * 알림톡 발송 API
 * POST /api/kakao/send
 */

interface Env {
  'SOLAPI_API_Key ': string;
  SOLAPI_API_Secret?: string;
  DB: any;
}

interface SendRequest {
  userId: string;
  templateId: string;
  recipients: Array<{
    to: string;  // 수신번호
    name?: string;
    variables?: Record<string, string>;
  }>;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;
    const DB = context.env.DB;

    if (!SOLAPI_API_Key) {
      return new Response(
        JSON.stringify({ success: false, error: 'SOLAPI API credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: SendRequest = await context.request.json();
    const { userId, templateId, recipients } = body;

    if (!userId || !templateId || !recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Required fields: userId, templateId, recipients[]',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DB에서 템플릿 정보 조회
    const template = await DB.prepare(`
      SELECT 
        t.solapiTemplateId, t.solapiChannelId, t.status, t.content, t.templateName,
        c.searchId as channelSearchId
      FROM KakaoAlimtalkTemplate t
      JOIN KakaoChannel c ON t.channelId = c.id
      WHERE t.id = ? AND t.userId = ?
    `).bind(templateId, userId).first();

    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (template.status !== 'APPROVED') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `승인된 템플릿만 발송할 수 있습니다. 현재 상태: ${template.status}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi 메시지 발송 API 호출 (ISO 8601 format)
    const dateTime = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const signature = await generateSignature(SOLAPI_API_Secret, dateTime, salt);

    // 메시지 구성
    const messages = recipients.map(recipient => ({
      to: recipient.to,
      from: template.channelSearchId,  // 발신자 ID
      kakaoOptions: {
        pfId: template.solapiChannelId,
        templateId: template.solapiTemplateId,
        variables: recipient.variables || {},
      },
    }));

    console.log('📤 Sending AlimTalk messages:', {
      templateId: template.solapiTemplateId,
      recipientCount: recipients.length,
    });

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${dateTime}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Solapi send error:', {
        status: response.status,
        errorData,
      });

      let errorMessage = `Failed to send messages: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.errorMessage || errorJson.message || errorMessage;
      } catch (e) {
        // ignore
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: errorData,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('✅ Messages sent:', result);

    // DB에 발송 내역 저장
    if (DB) {
      try {
        const historyId = `send_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const userName = ''; // TODO: Get from session

        await DB.prepare(`
          INSERT INTO MessageSendHistory (
            id, userId, userName, messageType, senderNumber,
            channelId, templateId, recipientCount, recipients,
            messageTitle, messageContent, pointsUsed, pointCostPerMessage,
            successCount, failCount, status, sendResults,
            sentAt, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
        `).bind(
          historyId,
          userId,
          userName,
          'KAKAO_ALIMTALK',
          template.channelSearchId,
          template.solapiChannelId,
          templateId,
          recipients.length,
          JSON.stringify(recipients),
          template.templateName,
          template.content,
          recipients.length * 15,  // 알림톡 예상 포인트 (15포인트/건)
          15,
          result.successCount || 0,
          result.failCount || 0,
          'COMPLETED',
          JSON.stringify(result)
        ).run();

        console.log(`✅ Send history saved: ${historyId}`);
      } catch (dbError) {
        console.error('❌ Failed to save send history:', dbError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `알림톡 ${recipients.length}건 발송 완료`,
        result: {
          groupId: result.groupId,
          successCount: result.successCount || 0,
          failCount: result.failCount || 0,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error sending messages:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send messages',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function generateSignature(secret: string, dateTime: string, salt: string): Promise<string> {
  const message = dateTime + salt;
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
