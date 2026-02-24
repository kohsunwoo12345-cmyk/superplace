/**
 * 환경변수 확인용 테스트 엔드포인트
 * GET /api/test-env
 */

interface Env {
  [key: string]: any;
}

export async function onRequestGet(context: { env: Env }) {
  const envKeys = Object.keys(context.env);
  
  // SOLAPI 관련 환경변수 찾기
  const solapiKeys = envKeys.filter(key => key.includes('SOLAPI'));
  
  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Environment variables check',
      allKeys: envKeys,
      solapiKeys: solapiKeys,
      // 실제 값은 보안상 앞 4자리만 표시
      solapiValues: solapiKeys.reduce((acc, key) => {
        const value = context.env[key];
        acc[key] = typeof value === 'string' && value.length > 4 
          ? value.substring(0, 4) + '...' 
          : typeof value;
        return acc;
      }, {} as Record<string, any>)
    }, null, 2),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
