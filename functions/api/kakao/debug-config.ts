// Debug API to check Solapi configuration
export async function onRequest(context: any) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hasApiKey = !!env.SOLAPI_API_KEY;
    const hasApiSecret = !!env.SOLAPI_API_SECRET;
    const testMode = env.ENABLE_KAKAO_TEST_MODE === 'true';

    const config = {
      solapiConfigured: hasApiKey && hasApiSecret,
      hasApiKey: hasApiKey,
      hasApiSecret: hasApiSecret,
      apiKeyLength: hasApiKey ? env.SOLAPI_API_KEY.length : 0,
      apiSecretLength: hasApiSecret ? env.SOLAPI_API_SECRET.length : 0,
      testModeEnabled: testMode,
      apiKeyPrefix: hasApiKey ? env.SOLAPI_API_KEY.substring(0, 8) + '...' : 'NOT SET',
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        config,
        message: config.solapiConfigured 
          ? '✅ Solapi 인증 정보가 올바르게 설정되었습니다.' 
          : '❌ Solapi 인증 정보가 설정되지 않았습니다. Cloudflare Pages 환경변수를 확인하세요.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Debug API error:', error);
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
