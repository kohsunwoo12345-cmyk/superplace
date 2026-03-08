// Debug API to check Solapi channels
export async function onRequest(context: any) {
  const { env } = context;

  try {
    // Get Solapi credentials
    const envAny = env as any;
    const SOLAPI_API_KEY = (envAny['SOLAPI_API_Key '] || envAny['SOLAPI_API_Key'] || envAny.SOLAPI_API_Key || envAny.SOLAPI_API_KEY)?.trim();
    const SOLAPI_API_SECRET = (envAny.SOLAPI_API_SECRET || envAny.SOLAPI_API_Secret || envAny['SOLAPI_API_Secret'])?.trim();

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solapi credentials not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create HMAC signature
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15);
    const message = date + salt;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SOLAPI_API_SECRET);
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

    const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signatureHex}`;

    console.log('🔐 Auth Header:', {
      apiKeyPreview: SOLAPI_API_KEY.substring(0, 8) + '...',
      date,
      salt,
      signaturePreview: signatureHex.substring(0, 16) + '...',
    });

    // Call Solapi API
    const response = await fetch('https://api.solapi.com/kakao/v2/plus-friends', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('📥 Solapi Response:', {
      status: response.status,
      ok: response.ok,
      body: responseText,
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { rawResponse: responseText };
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        data: data,
        debug: {
          apiEndpoint: 'https://api.solapi.com/kakao/v2/plus-friends',
          method: 'GET',
          hasCredentials: {
            apiKey: !!SOLAPI_API_KEY,
            apiSecret: !!SOLAPI_API_SECRET,
          }
        }
      }, null, 2),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }, null, 2),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}
