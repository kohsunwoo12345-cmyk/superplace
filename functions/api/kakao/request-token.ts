/**
 * 카카오톡 채널 연동 토큰 요청 API
 * POST /api/kakao/request-token
 */

interface Env {
  SOLAPI_API_Key: string;
  SOLAPI_API_Secret: string;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const { SOLAPI_API_Key, SOLAPI_API_Secret } = context.env;

    if (!SOLAPI_API_Key || !SOLAPI_API_Secret) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SOLAPI API credentials not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { searchId, phoneNumber } = body;

    if (!searchId || !phoneNumber) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'searchId and phoneNumber are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi REST API 직접 호출
    const timestamp = Date.now().toString();
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);
    
    const response = await fetch('https://api.solapi.com/kakao/v1/plus-friends/token', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plusFriendId: searchId,
        phoneNumber: phoneNumber,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Solapi API error:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to request token: ${response.status}` 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '인증번호가 SMS로 전송되었습니다. 휴대전화를 확인해주세요.',
        result: data
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error requesting channel token:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to request token' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function generateSignature(secret: string, timestamp: string, salt: string): Promise<string> {
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
