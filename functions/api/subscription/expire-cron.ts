// 구독 자동 만료 처리 크론잡
// Cloudflare Cron Trigger: 매일 자정 실행
// wrangler.toml에 추가: [triggers] crons = ["0 0 * * *"]

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  
  try {
    const logs: string[] = [];
    const now = new Date().toISOString();
    
    logs.push(`🕐 구독 만료 체크 시작: ${now}`);
    
    // 1. 만료된 구독 조회
    const expiredSubs = await DB.prepare(`
      SELECT id, userId, planName, endDate 
      FROM user_subscriptions 
      WHERE status = 'active' 
        AND datetime(endDate) < datetime('now')
    `).all();
    
    const expiredCount = expiredSubs.results?.length || 0;
    logs.push(`📊 만료된 구독: ${expiredCount}개`);
    
    if (expiredCount === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: '만료된 구독이 없습니다.',
        expiredCount: 0,
        logs
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // 2. 만료 처리
    let processedCount = 0;
    for (const sub of expiredSubs.results || []) {
      try {
        // status를 expired로 변경
        await DB.prepare(`
          UPDATE user_subscriptions 
          SET status = 'expired', 
              updatedAt = datetime('now')
          WHERE id = ?
        `).bind(sub.id).run();
        
        logs.push(`✅ 구독 만료 처리: userId=${sub.userId}, plan=${sub.planName}, endDate=${sub.endDate}`);
        processedCount++;
      } catch (error: any) {
        logs.push(`❌ 처리 실패 (id=${sub.id}): ${error.message}`);
      }
    }
    
    logs.push(`✅ 총 ${processedCount}개 구독 만료 처리 완료`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `${processedCount}개 구독이 만료되었습니다.`,
      expiredCount: processedCount,
      logs
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("Subscription expiry cron error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to process subscription expiry",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Cloudflare Workers Cron 핸들러
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  console.log("Cron trigger started");
  
  // onRequest와 동일한 로직 실행
  const request = new Request("https://dummy.com");
  const response = await onRequest({ request, env } as any);
  
  const result = await response.json();
  console.log("Cron result:", result);
}
