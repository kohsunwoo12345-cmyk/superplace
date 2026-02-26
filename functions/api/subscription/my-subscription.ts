// 사용자 구독 정보 조회 API
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 활성 구독 조회
    const subscription = await env.DB.prepare(`
      SELECT * FROM user_subscriptions WHERE userId = ? AND status = 'active'
    `).bind(userId).first();
    
    if (!subscription) {
      return new Response(
        JSON.stringify({
          success: true,
          subscription: null,
          message: '활성 구독이 없습니다.'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 구독 만료 확인
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (endDate < now) {
      // 만료된 구독 상태 업데이트
      await env.DB.prepare(`
        UPDATE user_subscriptions SET status = 'expired', updatedAt = ? WHERE id = ?
      `).bind(now.toISOString(), subscription.id).run();
      
      return new Response(
        JSON.stringify({
          success: true,
          subscription: null,
          message: '구독이 만료되었습니다.'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 월별 사용량 리셋 확인 (매월 1일)
    const lastReset = new Date(subscription.lastResetDate);
    const currentMonth = now.getMonth();
    const lastResetMonth = lastReset.getMonth();
    
    if (currentMonth !== lastResetMonth) {
      // 사용량 리셋
      await env.DB.prepare(`
        UPDATE user_subscriptions SET
          current_homework_checks = 0,
          current_ai_analysis = 0,
          current_similar_problems = 0,
          lastResetDate = ?,
          updatedAt = ?
        WHERE id = ?
      `).bind(now.toISOString(), now.toISOString(), subscription.id).run();
      
      subscription.current_homework_checks = 0;
      subscription.current_ai_analysis = 0;
      subscription.current_similar_problems = 0;
      subscription.lastResetDate = now.toISOString();
    }
    
    // 구독 정보 반환
    const responseData = {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planId,
      planName: subscription.planName,
      period: subscription.period,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      currentUsage: {
        students: subscription.current_students || 0,
        homeworkChecks: subscription.current_homework_checks || 0,
        aiAnalysis: subscription.current_ai_analysis || 0,
        similarProblems: subscription.current_similar_problems || 0,
        landingPages: subscription.current_landing_pages || 0
      },
      limits: {
        maxStudents: subscription.max_students || 0,
        maxHomeworkChecks: subscription.max_homework_checks || 0,
        maxAIAnalysis: subscription.max_ai_analysis || 0,
        maxSimilarProblems: subscription.max_similar_problems || 0,
        maxLandingPages: subscription.max_landing_pages || 0
      },
      lastPaymentAmount: subscription.lastPaymentAmount,
      lastPaymentDate: subscription.lastPaymentDate,
      autoRenew: subscription.autoRenew === 1,
      daysRemaining: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        subscription: responseData
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch subscription',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
