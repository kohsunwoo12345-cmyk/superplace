/**
 * 환경변수 확인용 테스트 엔드포인트
 * GET /api/test-env
 */

interface Env {
  SOLAPI_API_Key?: string;
  SOLAPI_API_Secret?: string;
  [key: string]: any;
}

export async function onRequestGet(context: { env: Env }) {
  const env = context.env;
  
  // 모든 환경변수 키 확인
  const allKeys = Object.keys(env);
  
  // SOLAPI 관련 키 찾기
  const solapiRelated = allKeys.filter(key => 
    key.toLowerCase().includes('solapi')
  );
  
  return new Response(
    JSON.stringify({ 
      success: true,
      totalEnvVars: allKeys.length,
      allEnvKeys: allKeys,
      solapiRelatedKeys: solapiRelated,
      checks: {
        'SOLAPI_API_Key': {
          exists: !!env.SOLAPI_API_Key,
          type: typeof env.SOLAPI_API_Key,
          length: env.SOLAPI_API_Key?.length || 0,
          prefix: env.SOLAPI_API_Key?.substring(0, 8) || 'N/A'
        },
        'SOLAPI_API_Secret': {
          exists: !!env.SOLAPI_API_Secret,
          type: typeof env.SOLAPI_API_Secret,
          length: env.SOLAPI_API_Secret?.length || 0,
          prefix: env.SOLAPI_API_Secret?.substring(0, 8) || 'N/A'
        }
      }
    }, null, 2),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
