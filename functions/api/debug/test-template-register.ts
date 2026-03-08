/**
 * 디버그용: 템플릿 등록 요청 데이터 확인
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

async function createSolapiSignature(apiSecret: string) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const message = date + salt;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { date, salt, signature: signatureHex };
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const env = context.env as any;
    const SOLAPI_API_KEY = (env['SOLAPI_API_Key '] || env['SOLAPI_API_Key'] || env.SOLAPI_API_Key || env.SOLAPI_API_KEY)?.trim();
    const SOLAPI_API_SECRET = (env['SOLAPI_API_Secret '] || env['SOLAPI_API_Secret'] || env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET)?.trim();

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Solapi credentials not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create test template data
    const testTemplateData = {
      name: `test_template_${Date.now()}`,
      content: "안녕하세요 #{이름}님, 테스트 메시지입니다.",
      categoryCode: "012",
      messageType: "BA",
      securityFlag: false
    };

    const { date, salt, signature } = await createSolapiSignature(SOLAPI_API_SECRET);

    const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;

    // Send to Solapi
    const solapiResponse = await fetch('https://api.solapi.com/kakao/v1/templates', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testTemplateData)
    });

    const solapiData = await solapiResponse.json();

    return new Response(JSON.stringify({
      success: solapiResponse.ok,
      status: solapiResponse.status,
      request: {
        url: 'https://api.solapi.com/kakao/v1/templates',
        method: 'POST',
        headers: {
          Authorization: authHeader.substring(0, 80) + '...',
          'Content-Type': 'application/json'
        },
        body: testTemplateData
      },
      response: solapiData
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
