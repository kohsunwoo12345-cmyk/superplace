/**
 * 카카오톡 채널 카테고리 조회 API
 * GET /api/kakao/channel-categories
 */

interface Env {
  'SOLAPI_API_Key ': string;  // 주의: 끝에 공백이 있는 환경변수명
  SOLAPI_API_Secret?: string;
}

export async function onRequestGet(context: { env: Env }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];  // 공백 포함
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;

    if (!SOLAPI_API_Key || !SOLAPI_API_Secret) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SOLAPI API credentials not configured',
          debug: {
            hasKey: !!SOLAPI_API_Key,
            hasSecret: !!SOLAPI_API_Secret
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi REST API 직접 호출
    const timestamp = new Date().toISOString();  // ISO 8601 형식
    const salt = Math.random().toString(36).substring(2);
    
    // HMAC 서명 생성
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);
    
    const response = await fetch('https://api.solapi.com/kakao/v1/plus-friends/categories', {
      method: 'GET',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Solapi API error:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch categories: ${response.status}`,
          details: errorData,
          debug: {
            url: 'https://api.solapi.com/kakao/v1/plus-friends/categories',
            timestamp,
            salt
          }
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        categories: data.categories || data
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching channel categories:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch categories' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function generateSignature(secret: string | undefined, timestamp: string, salt: string): Promise<string> {
  if (!secret) {
    throw new Error('SOLAPI_API_Secret is required');
  }
  const message = timestamp + salt;
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
