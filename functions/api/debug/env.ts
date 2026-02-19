// Debug endpoint to check environment variables and bindings

export async function onRequestGet(context: any) {
  try {
    const envInfo = {
      hasEnv: !!context.env,
      envKeys: context.env ? Object.keys(context.env) : [],
      hasDB: !!context.env?.DB,
      dbType: context.env?.DB ? typeof context.env.DB : 'undefined',
      platform: context.platform || 'unknown',
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Environment Debug:', envInfo);

    return new Response(
      JSON.stringify({
        success: true,
        data: envInfo,
        message: 'Environment information'
      }, null, 2),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      }
    );
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
