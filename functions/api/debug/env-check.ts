// Debug API: Check Environment Variables
// GET /api/debug/env-check

interface Env {
  DB?: D1Database;
  SOLAPI_API_Key?: string;
  SOLAPI_API_Secret?: string;
  [key: string]: any;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  const { env } = context;
  
  // 모든 환경변수 키 수집
  const allEnvKeys = Object.keys(env);
  const solapiKeys = allEnvKeys.filter(k => 
    k.toLowerCase().includes('solapi') || 
    k.toLowerCase().includes('api')
  );
  
  // 여러 방식으로 접근 시도
  const envAny = env as any;
  const accessTests = {
    // 직접 접근
    direct_SOLAPI_API_Key: env.SOLAPI_API_Key,
    direct_SOLAPI_API_Secret: env.SOLAPI_API_Secret,
    
    // 대괄호 접근
    bracket_SOLAPI_API_Key: envAny['SOLAPI_API_Key'],
    bracket_SOLAPI_API_Secret: envAny['SOLAPI_API_Secret'],
    
    // 대문자 버전
    upper_SOLAPI_API_KEY: envAny['SOLAPI_API_KEY'],
    upper_SOLAPI_API_SECRET: envAny['SOLAPI_API_SECRET'],
    
    // 언더스코어 하나
    single_SOLAPI_API_Key: envAny['SOLAPI_API_Key'],
    single_SOLAPI_API_Secret: envAny['SOLAPI_API_Secret'],
  };
  
  const result = {
    timestamp: new Date().toISOString(),
    allEnvKeys: allEnvKeys.length,
    solapiRelatedKeys: solapiKeys,
    allKeys: allEnvKeys,
    accessTests: Object.entries(accessTests).map(([key, value]) => ({
      method: key,
      exists: !!value,
      type: typeof value,
      length: typeof value === 'string' ? value.length : 0,
      preview: typeof value === 'string' ? value.substring(0, 8) + '...' : 'N/A',
    })),
    finalValues: {
      key: envAny['SOLAPI_API_Key'] || envAny.SOLAPI_API_Key || envAny.SOLAPI_API_KEY || 'NOT_FOUND',
      secret: envAny['SOLAPI_API_Secret'] || envAny.SOLAPI_API_Secret || envAny.SOLAPI_API_SECRET || 'NOT_FOUND',
    },
  };
  
  return new Response(
    JSON.stringify(result, null, 2),
    {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
