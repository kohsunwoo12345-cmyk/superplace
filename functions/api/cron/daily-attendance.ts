/**
 * Cloudflare Cron Trigger
 * 매일 밤 11시(KST, UTC+9)에 자동 출석 처리 실행
 * 
 * Cron 표현식: "0 14 * * *" (UTC 14:00 = KST 23:00)
 * 
 * Cloudflare Dashboard에서 설정:
 * Settings > Functions > Cron Triggers
 * Cron expression: 0 14 * * *
 * URL: /api/cron/daily-attendance
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  console.log('🕐 Cron Job 실행: 자동 출석 처리');

  try {
    // 자동 출석 처리 API 호출
    const autoProcessUrl = new URL('/api/attendance/auto-process', request.url);
    const autoProcessRequest = new Request(autoProcessUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 내부 API 호출을 위해 env를 전달
    const autoProcessModule = await import('../attendance/auto-process');
    const result = await autoProcessModule.onRequestPost({
      request: autoProcessRequest,
      env: { DB }
    });

    const data = await result.json();
    console.log('✅ 자동 출석 처리 완료:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cron job executed successfully',
        timestamp: new Date().toISOString(),
        result: data
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Cron Job 실행 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cron job execution failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// POST 요청도 지원 (수동 트리거용)
export const onRequestPost = onRequestGet;
