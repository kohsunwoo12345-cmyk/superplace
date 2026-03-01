// Solapi Request Token API
export async function onRequest(context: any) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { searchId, phoneNumber } = body;

    if (!searchId || !phoneNumber) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: searchId, phoneNumber' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SOLAPI_API_KEY = env.SOLAPI_API_Key || env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET;
    const ENABLE_TEST_MODE = env.ENABLE_KAKAO_TEST_MODE === 'true';

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      if (!ENABLE_TEST_MODE) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Solapi credentials not configured. Set ENABLE_KAKAO_TEST_MODE=true to test without Solapi.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Test mode: Return success without actually sending SMS
      console.log('⚠️ TEST MODE: Skipping Solapi SMS, returning mock success');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '테스트 모드: 인증번호가 전송되었습니다. (실제 SMS 없음)',
          testMode: true,
          mockToken: 123456
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Authorization header
    const authString = Buffer.from(`${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`).toString('base64');

    console.log('📤 Requesting token from Solapi:', {
      searchId,
      phoneNumber: phoneNumber.substring(0, 3) + '****'
    });

    // Request token from Solapi API v2
    const response = await fetch('https://api.solapi.com/kakao/v2/plus-friends/request-token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plusFriendId: searchId,
        phoneNumber: phoneNumber
      })
    });

    const data = await response.json();

    console.log('📥 Solapi response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.errorMessage || data.message || 'Failed to request token',
          details: data,
          debug: {
            status: response.status,
            searchId,
            phoneNumberLength: phoneNumber.length
          }
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '인증번호가 전송되었습니다.',
        data 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Request token error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
