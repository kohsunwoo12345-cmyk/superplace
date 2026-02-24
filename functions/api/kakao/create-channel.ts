/**
 * 카카오톡 채널 연동(추가) API
 * POST /api/kakao/create-channel
 */

interface Env {
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
  DB: any;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const { SOLAPI_API_KEY, SOLAPI_API_SECRET, DB } = context.env;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SOLAPI API credentials not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { searchId, phoneNumber, categoryCode, token } = body;

    if (!searchId || !phoneNumber || !categoryCode || !token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'All fields are required: searchId, phoneNumber, categoryCode, token' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi REST API 직접 호출
    const timestamp = Date.now().toString();
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_SECRET, timestamp, salt);
    
    const response = await fetch('https://api.solapi.com/kakao/v1/plus-friends', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plusFriendId: searchId,
        phoneNumber: phoneNumber,
        categoryCode: categoryCode,
        token: token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Solapi API error:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create channel: ${response.status}. 인증번호를 확인해주세요.` 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    // DB에 채널 정보 저장
    if (DB) {
      try {
        await DB.prepare(`
          INSERT OR REPLACE INTO KakaoChannels (
            searchId, phoneNumber, categoryCode, pfId, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          searchId,
          phoneNumber,
          categoryCode,
          result.pfId || result.plusFriendId || '',
          'active'
        ).run();
      } catch (dbError) {
        console.error('Failed to save channel to DB:', dbError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '카카오톡 채널이 성공적으로 연동되었습니다!',
        channel: result 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating channel:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create channel' 
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
