// Solapi Connection Test Endpoint
export async function onRequest(context: any) {
  const { env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Starting Solapi connection test...');
    
    // Check environment variables
    const SOLAPI_API_KEY = env.SOLAPI_API_Key || env.SOLAPI_API_KEY || env['SOLAPI_API_Key '];
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET;

    console.log('🔍 Environment check:', {
      hasApiKey: !!SOLAPI_API_KEY,
      apiKeyLength: SOLAPI_API_KEY?.length || 0,
      apiKeyStart: SOLAPI_API_KEY?.substring(0, 10) || 'N/A',
      hasApiSecret: !!SOLAPI_API_SECRET,
      apiSecretLength: SOLAPI_API_SECRET?.length || 0,
      allEnvKeys: Object.keys(env).filter(k => k.toLowerCase().includes('solapi'))
    });

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solapi credentials not found',
          envKeys: Object.keys(env).filter(k => k.toLowerCase().includes('solapi'))
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test HMAC generation
    console.log('🔐 Testing HMAC generation...');
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15);
    const hmacData = date + salt;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SOLAPI_API_SECRET);
    const messageData = encoder.encode(hmacData);
    
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

    console.log('✅ HMAC generated successfully');

    // Test Solapi API connection (get balance)
    console.log('🌐 Testing Solapi API connection...');
    
    try {
      const testResponse = await fetch('https://api.solapi.com/cash/v1/balance', {
        method: 'GET',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signatureHex}`
        }
      });

      console.log('📡 Solapi test response:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok
      });

      const responseText = await testResponse.text();
      console.log('📄 Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Solapi connection test completed',
          credentials: {
            hasApiKey: true,
            apiKeyLength: SOLAPI_API_KEY.length,
            apiKeyStart: SOLAPI_API_KEY.substring(0, 10) + '...',
            hasApiSecret: true,
            apiSecretLength: SOLAPI_API_SECRET.length
          },
          hmac: {
            date,
            saltLength: salt.length,
            signatureLength: signatureHex.length,
            signatureStart: signatureHex.substring(0, 20) + '...'
          },
          apiTest: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            ok: testResponse.ok,
            response: responseData
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: any) {
      console.error('❌ Solapi fetch error:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Solapi API request failed',
          details: {
            message: fetchError.message,
            stack: fetchError.stack,
            name: fetchError.name
          },
          credentials: {
            hasApiKey: true,
            apiKeyLength: SOLAPI_API_KEY.length,
            hasApiSecret: true
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Test failed',
        details: {
          message: error.message,
          stack: error.stack
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
