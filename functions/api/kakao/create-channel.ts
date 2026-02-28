/**
 * 카카오톡 채널 연동(추가) API
 * POST /api/kakao/create-channel
 */

interface Env {
  'SOLAPI_API_Key ': string;  // 주의: 끝에 공백이 있는 환경변수명
  SOLAPI_API_Secret?: string;
  DB: any;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];  // 공백 포함
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;
    const DB = context.env.DB;

    if (!SOLAPI_API_Key) {
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

    // categoryCode는 필수 필드입니다 (Solapi API 요구사항)
    if (!searchId || !phoneNumber || !categoryCode || !token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Required fields: searchId, phoneNumber, categoryCode, token' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi API는 @ 기호 없이 순수 검색용 ID만 요구
    // 프론트엔드에서 이미 처리했지만 안전을 위해 다시 확인
    const cleanSearchId = searchId.startsWith('@') ? searchId.substring(1) : searchId;

    // Solapi REST API 직접 호출
    const timestamp = new Date().toISOString();  // ISO 8601 형식
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);
    
    // Request body 구성 (categoryCode는 필수)
    const requestBody = {
      searchId: cleanSearchId,
      phoneNumber: phoneNumber,
      categoryCode: categoryCode,
      token: token,
    };
    
    console.log('📤 Solapi API request:', {
      ...requestBody,
      originalSearchId: searchId,
      searchIdCleaned: cleanSearchId !== searchId
    });
    
    const response = await fetch('https://api.solapi.com/kakao/v1/plus-friends', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Solapi API error:', errorData);
      console.error('Request data:', { 
        originalSearchId: searchId,
        cleanSearchId: cleanSearchId, 
        phoneNumber, 
        categoryCode, 
        token: '***' 
      });
      
      let errorMessage = `Failed to create channel: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.errorMessage) {
          errorMessage = errorJson.errorMessage;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        // errorData가 JSON이 아닌 경우
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: errorData,
          debug: { 
            originalSearchId: searchId,
            cleanSearchId: cleanSearchId,
            phoneNumber, 
            categoryCode, 
            tokenLength: token?.length 
          }
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
          cleanSearchId,  // @ 기호가 제거된 순수 ID 저장
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
