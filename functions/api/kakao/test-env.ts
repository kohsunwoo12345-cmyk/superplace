// Test environment variables
export async function onRequestGet(context: any) {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Get all environment variable keys
    const envKeys = Object.keys(env || {});
    
    // Check for Solapi keys
    const SOLAPI_API_KEY = env.SOLAPI_API_Key || env.SOLAPI_API_KEY || env['SOLAPI_API_Key'] || null;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET || env['SOLAPI_API_Secret'] || null;
    
    // Check all variations
    const variations = {
      'SOLAPI_API_Key': env.SOLAPI_API_Key,
      'SOLAPI_API_KEY': env.SOLAPI_API_KEY,
      'SOLAPI_API_Secret': env.SOLAPI_API_Secret,
      'SOLAPI_API_SECRET': env.SOLAPI_API_SECRET,
      'env["SOLAPI_API_Key"]': env['SOLAPI_API_Key'],
      'env["SOLAPI_API_Secret"]': env['SOLAPI_API_Secret'],
    };
    
    const result = {
      success: true,
      message: 'Environment variable test',
      envInfo: {
        totalKeys: envKeys.length,
        allKeys: envKeys,
        solapiKeys: envKeys.filter(k => k.toLowerCase().includes('solapi')),
        hasAPIKey: !!SOLAPI_API_KEY,
        hasAPISecret: !!SOLAPI_API_SECRET,
        apiKeyLength: SOLAPI_API_KEY ? SOLAPI_API_KEY.length : 0,
        apiSecretLength: SOLAPI_API_SECRET ? SOLAPI_API_SECRET.length : 0,
        apiKeyPreview: SOLAPI_API_KEY ? SOLAPI_API_KEY.substring(0, 10) + '...' : null,
        variations: Object.entries(variations).map(([key, val]) => ({
          key,
          exists: !!val,
          type: typeof val,
          length: val ? val.length : 0
        }))
      }
    };
    
    return new Response(
      JSON.stringify(result, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}
