// Solapi SMS API Integration
// Solapi (구 Coolsms) API를 사용한 SMS 발송

export interface SolapiConfig {
  apiKey: string;
  apiSecret: string;
  senderPhone: string;
}

export interface SolapiSendResult {
  success: boolean;
  messageId?: string;
  statusCode?: string;
  statusMessage?: string;
  error?: string;
}

export interface SolapiMessage {
  to: string;
  from: string;
  text: string;
  type?: 'SMS' | 'LMS' | 'MMS';
}

/**
 * Solapi API로 SMS 발송
 * @param config Solapi 설정
 * @param messages 발송할 메시지 목록
 * @returns 발송 결과
 */
export async function sendSMS(
  config: SolapiConfig,
  messages: SolapiMessage[]
): Promise<SolapiSendResult[]> {
  const { apiKey, apiSecret } = config;

  // Solapi API 엔드포인트
  const url = 'https://api.solapi.com/messages/v4/send';

  // 인증 정보
  const timestamp = new Date().toISOString();
  const salt = generateSalt();
  const signature = await generateSignature(apiSecret, timestamp, salt);

  // 요청 헤더
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
  };

  // 메시지 타입 자동 결정
  const formattedMessages = messages.map((msg) => {
    const byteLength = new Blob([msg.text]).size;
    let type = msg.type || 'SMS';
    
    if (!msg.type) {
      if (byteLength > 90) {
        type = 'LMS';
      }
    }

    return {
      to: msg.to.replace(/-/g, ''), // 하이픈 제거
      from: msg.from.replace(/-/g, ''),
      text: msg.text,
      type,
    };
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: formattedMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorMessage || 'SMS 발송 실패');
    }

    // 결과 반환
    return formattedMessages.map((_, index) => ({
      success: true,
      messageId: data.groupId || `msg_${Date.now()}_${index}`,
      statusCode: '2000',
      statusMessage: '정상 발송',
    }));
  } catch (error: any) {
    console.error('Solapi SMS 발송 오류:', error);
    return formattedMessages.map(() => ({
      success: false,
      error: error.message || '발송 실패',
    }));
  }
}

/**
 * 단일 SMS 발송
 */
export async function sendSingleSMS(
  config: SolapiConfig,
  to: string,
  text: string,
  from?: string
): Promise<SolapiSendResult> {
  const results = await sendSMS(config, [
    {
      to,
      from: from || config.senderPhone,
      text,
    },
  ]);

  return results[0];
}

/**
 * 대량 SMS 발송 (배치)
 */
export async function sendBulkSMS(
  config: SolapiConfig,
  recipients: Array<{ phone: string; name: string }>,
  text: string,
  from?: string
): Promise<SolapiSendResult[]> {
  const messages = recipients.map((recipient) => ({
    to: recipient.phone,
    from: from || config.senderPhone,
    text: text.replace(/\{name\}/g, recipient.name), // 이름 치환
  }));

  return await sendSMS(config, messages);
}

/**
 * Salt 생성
 */
function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * HMAC-SHA256 서명 생성
 */
async function generateSignature(
  apiSecret: string,
  timestamp: string,
  salt: string
): Promise<string> {
  const message = timestamp + salt;
  
  // Web Crypto API를 사용한 HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // ArrayBuffer를 hex 문자열로 변환
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Solapi 잔액 조회
 */
export async function getSolapiBalance(config: SolapiConfig): Promise<number> {
  const { apiKey, apiSecret } = config;
  const url = 'https://api.solapi.com/cash/v1/balance';

  const timestamp = new Date().toISOString();
  const salt = generateSalt();
  const signature = await generateSignature(apiSecret, timestamp, salt);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorMessage || '잔액 조회 실패');
    }

    return data.balance || 0;
  } catch (error) {
    console.error('Solapi 잔액 조회 오류:', error);
    return 0;
  }
}
