// API: 환경 변수 테스트 (디버깅용)
// GET /api/test-env

interface Env {
  GEMINI_API_KEY: string;
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    const db = context.env.DB;
    
    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        GEMINI_API_KEY: apiKey ? {
          exists: true,
          length: apiKey.length,
          prefix: apiKey.substring(0, 10) + '...',
        } : {
          exists: false,
          message: '❌ GEMINI_API_KEY가 설정되지 않았습니다'
        },
        DB: db ? {
          exists: true,
          type: typeof db,
        } : {
          exists: false,
          message: '❌ DB가 설정되지 않았습니다'
        }
      },
      cloudflareInfo: {
        workerId: context.env?.CF_WORKER_ID || 'N/A',
        region: context.request.cf?.region || 'N/A',
        country: context.request.cf?.country || 'N/A',
      }
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
