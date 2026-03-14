// Solapi 직접 API 호출 (Cloudflare Pages Functions 호환)
const SOLAPI_BASE_URL = 'https://api.solapi.com';

interface SolapiConfig {
  apiKey: string;
  apiSecret: string;
}

export function getSolapiConfig(db?: D1Database): SolapiConfig {
  const apiKey = process.env.SOLAPI_API_KEY || '';
  const apiSecret = process.env.SOLAPI_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    throw new Error('SOLAPI_API_KEY and SOLAPI_API_SECRET must be set in environment variables');
  }

  return { apiKey, apiSecret };
}

// HMAC 서명 생성 (Cloudflare Web Crypto API 사용)
async function createHmacSignature(apiKey: string, apiSecret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = timestamp + salt;
  
  // TextEncoder로 문자열을 Uint8Array로 변환
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const message = encoder.encode(data);
  
  // Web Crypto API로 HMAC-SHA256 생성
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  
  // ArrayBuffer를 hex 문자열로 변환
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signatureHex}`;
}

// Solapi API 요청 헬퍼
async function solapiRequest(
  endpoint: string,
  options: RequestInit & { apiKey: string; apiSecret: string }
) {
  const { apiKey, apiSecret, ...fetchOptions } = options;
  const authorization = await createHmacSignature(apiKey, apiSecret);
  
  const response = await fetch(`${SOLAPI_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization,
      ...fetchOptions.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Solapi API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// 템플릿 카테고리 조회
export async function getTemplateCategories(db?: D1Database) {
  const config = getSolapiConfig(db);
  return await solapiRequest('/kakao/v2/template-categories', {
    method: 'GET',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  });
}

// 템플릿 생성
export async function createTemplate(templateData: any, db?: D1Database) {
  const config = getSolapiConfig(db);
  return await solapiRequest('/kakao/v2/templates', {
    method: 'POST',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    body: JSON.stringify(templateData),
  });
}

// 템플릿 목록 조회
export async function getTemplates(params?: any, db?: D1Database) {
  const config = getSolapiConfig(db);
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return await solapiRequest(`/kakao/v2/templates${queryString}`, {
    method: 'GET',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  });
}

// 템플릿 단일 조회
export async function getTemplate(templateId: string, db?: D1Database) {
  const config = getSolapiConfig(db);
  return await solapiRequest(`/kakao/v2/templates/${templateId}`, {
    method: 'GET',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  });
}

// 템플릿 수정
export async function updateTemplate(templateId: string, templateData: any, db?: D1Database) {
  const config = getSolapiConfig(db);
  return await solapiRequest(`/kakao/v2/templates/${templateId}`, {
    method: 'PUT',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    body: JSON.stringify(templateData),
  });
}

// 템플릿 삭제
export async function deleteTemplate(templateId: string, db?: D1Database) {
  const config = getSolapiConfig(db);
  return await solapiRequest(`/kakao/v2/templates/${templateId}`, {
    method: 'DELETE',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  });
}

// 템플릿 검수 요청
export async function requestInspection(templateId: string, db?: D1Database) {
  const config = getSolapiConfig(db);
  return await solapiRequest(`/kakao/v2/templates/${templateId}/request`, {
    method: 'POST',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  });
}

// 템플릿 검수 취소
export async function cancelInspection(templateId: string, db?: D1Database) {
  const config = getSolapiConfig(db);
  return await solapiRequest(`/kakao/v2/templates/${templateId}/cancel`, {
    method: 'POST',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  });
}

// 알림톡 발송
export async function sendAlimtalk(params: {
  templateId: string;
  to: string;
  variables?: Record<string, string>;
  buttons?: any[];
}, db?: D1Database) {
  const config = getSolapiConfig(db);
  
  const messageData = {
    to: params.to,
    from: process.env.SOLAPI_SENDER_NUMBER || '',
    kakaoOptions: {
      pfId: process.env.SOLAPI_CHANNEL_ID || '',
      templateId: params.templateId,
      variables: params.variables || {},
      buttons: params.buttons || [],
    },
  };

  return await solapiRequest('/messages/v4/send', {
    method: 'POST',
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    body: JSON.stringify(messageData),
  });
}

// SMS 발송
export async function sendSMS(
  from: string,
  to: string,
  text: string,
  db?: D1Database
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getSolapiConfig(db);
    
    const messageData = {
      message: {
        to,
        from,
        text,
        type: text.length > 90 ? 'LMS' : 'SMS',
      }
    };

    await solapiRequest('/messages/v4/send', {
      method: 'POST',
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      body: JSON.stringify(messageData),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('SMS send error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send SMS' 
    };
  }
}
