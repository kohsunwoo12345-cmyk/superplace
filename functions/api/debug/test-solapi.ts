// Test Solapi API directly
// GET /api/debug/test-solapi?to=01012345678&from=01012345678

interface Env {
  SOLAPI_API_Key?: string;
  SOLAPI_API_Secret?: string;
  [key: string]: any;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  const { request, env } = context;
  
  try {
    // URL 파라미터에서 수신/발신번호 가져오기
    const url = new URL(request.url);
    const to = url.searchParams.get('to') || '01012345678';
    const from = url.searchParams.get('from') || '01012345678';
    
    // 환경변수 읽기 (공백 포함 버전도 처리)
    const envAny = env as any;
    const SOLAPI_API_KEY = (
      envAny['SOLAPI_API_Key'] || 
      envAny['SOLAPI_API_Key '] ||
      envAny.SOLAPI_API_Key || 
      envAny.SOLAPI_API_KEY
    )?.trim();
    const SOLAPI_API_SECRET = (
      envAny['SOLAPI_API_Secret'] || 
      envAny['SOLAPI_API_Secret '] ||
      envAny.SOLAPI_API_Secret || 
      envAny.SOLAPI_API_SECRET
    )?.trim();
    
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Solapi API 키가 설정되지 않았습니다',
          keyExists: !!SOLAPI_API_KEY,
          secretExists: !!SOLAPI_API_SECRET,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // HMAC-SHA256 서명 생성
    const date = new Date().toISOString();
    const salt = crypto.randomUUID();
    const data = date + salt;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SOLAPI_API_SECRET);
    const messageData = encoder.encode(data);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signatureHex}`;
    
    // Solapi API 호출
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        message: {
          to: to.replace(/-/g, ''),
          from: from.replace(/-/g, ''),
          text: '[테스트] 문자 발송 시스템 테스트 메시지입니다.',
        },
      }),
    });
    
    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        request: {
          to,
          from,
          apiKeyPreview: SOLAPI_API_KEY?.substring(0, 8) + '...',
          authHeaderLength: authHeader.length,
          signatureLength: signatureHex.length,
        },
        response: result,
        timestamp: new Date().toISOString(),
      }, null, 2),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }, null, 2),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
