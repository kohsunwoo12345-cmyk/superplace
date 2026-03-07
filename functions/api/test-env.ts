/**
 * 환경변수 확인용 테스트 엔드포인트
 * GET /api/test-env
 */

interface Env {
  DATABASE_URL?: string;
  NEXTAUTH_SECRET?: string;
  [key: string]: any;
}

export async function onRequestGet(context: { env: Env }) {
  const env = context.env;
  
  // 모든 환경변수 키 확인
  const allKeys = Object.keys(env);
  
  return new Response(
    JSON.stringify({ 
      success: true,
      totalEnvVars: allKeys.length,
      allEnvKeys: allKeys,
      checks: {
        'DATABASE_URL': {
          exists: !!env.DATABASE_URL,
          type: typeof env.DATABASE_URL,
          length: env.DATABASE_URL?.length || 0
        },
        'NEXTAUTH_SECRET': {
          exists: !!env.NEXTAUTH_SECRET,
          type: typeof env.NEXTAUTH_SECRET,
          length: env.NEXTAUTH_SECRET?.length || 0
        }
      }
    }, null, 2),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
