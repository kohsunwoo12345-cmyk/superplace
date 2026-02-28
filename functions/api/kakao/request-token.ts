/**
 * 카카오톡 채널 연동 토큰 요청 API
 * POST /api/kakao/request-token
 */

interface Env {
  'SOLAPI_API_Key ': string;  // 주의: 끝에 공백이 있는 환경변수명
  SOLAPI_API_Secret?: string;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];  // 공백 포함
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;

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

    // Solapi API는 @ 기호 없이 순수 검색용 ID만 요구
    // 프론트엔드에서 이미 처리했지만 안전을 위해 다시 확인
    const cleanSearchId = searchId.startsWith('@') ? searchId.substring(1) : searchId;

    // Solapi REST API 직접 호출 (v2 API 사용)
    const timestamp = new Date().toISOString();  // ISO 8601 형식
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);
    
    // v2 API: 토큰 요청 시 categoryCode 불필요
    const requestBody = {
      searchId: cleanSearchId,
      phoneNumber: phoneNumber,
    };
    
    console.log('📤 Requesting Kakao channel token (v2):', {
      originalSearchId: searchId,
      cleanSearchId: cleanSearchId,
      hasAtSymbol: searchId.startsWith('@'),
      searchIdLength: cleanSearchId.length,
      phoneNumber: phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(7),
      url: 'https://api.solapi.com/kakao/v2/channels/token'
    });
    
    const response = await fetch('https://api.solapi.com/kakao/v2/channels/token', {
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
      console.error('Request details:', {
        url: 'https://api.solapi.com/kakao/v2/channels/token',
        searchId,
        cleanSearchId,
        phoneNumber,
        timestamp,
        hasApiKey: !!SOLAPI_API_Key,
        hasApiSecret: !!SOLAPI_API_Secret
      });
      
      let errorMessage = `Failed to request token: ${response.status}`;
      let userFriendlyMessage = '';
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.errorMessage) {
          errorMessage = errorJson.errorMessage;
          
          // 사용자 친화적인 에러 메시지 생성
          if (errorMessage.includes('존재하지 않는 카카오톡 채널')) {
            userFriendlyMessage = `입력하신 채널 ID를 찾을 수 없습니다.

확인 사항:
1. 카카오톡 채널 관리자센터(business.kakao.com)에 로그인
2. 왼쪽 메뉴 → "관리" 클릭
3. "검색용 아이디" 항목에서 정확한 ID 확인 (예: myacademy)
4. 채널 이름이 아닌 "검색용 ID"를 입력하세요
5. "홈 공개"와 "검색 허용"이 모두 ON 상태인지 확인
6. 채널이 "비즈니스 인증" 완료되었는지 확인

입력하신 ID: ${cleanSearchId}
ID 길이: ${cleanSearchId.length}자`;
          } else if (errorMessage.includes('카테고리를 선택해주세요')) {
            userFriendlyMessage = '카테고리를 선택해주세요';
          }
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        // errorData가 JSON이 아닌 경우
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userFriendlyMessage || errorMessage,
          details: errorData,
          debug: {
            url: 'https://api.solapi.com/kakao/v2/channels/token',
            timestamp,
            salt,
            actualRequestBody: requestBody,
            originalSearchId: searchId,
            cleanSearchId: cleanSearchId,
            searchIdLength: cleanSearchId?.length,
            phoneNumberLength: phoneNumber?.length,
            hadAtSymbol: searchId?.startsWith('@')
          }
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
