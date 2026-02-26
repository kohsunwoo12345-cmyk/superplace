// 사용량 증가 및 제한 체크 API
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    
    if (!data.userId || !data.type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Required fields: userId, type' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 활성 구독 조회
    const subscription = await env.DB.prepare(`
      SELECT * FROM user_subscriptions WHERE userId = ? AND status = 'active'
    `).bind(data.userId).first();
    
    if (!subscription) {
      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          error: '활성 구독이 없습니다. 요금제를 구독해주세요.',
          code: 'NO_SUBSCRIPTION'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 구독 만료 확인
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (endDate < now) {
      await env.DB.prepare(`
        UPDATE user_subscriptions SET status = 'expired', updatedAt = ? WHERE id = ?
      `).bind(now.toISOString(), subscription.id).run();
      
      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          error: '구독이 만료되었습니다. 요금제를 갱신해주세요.',
          code: 'SUBSCRIPTION_EXPIRED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 타입별 제한 체크 및 사용량 증가
    const { type, action } = data;  // action: 'check' | 'increment'
    
    let currentField, maxField, limitValue, currentValue;
    
    switch (type) {
      case 'student':
        currentField = 'current_students';
        maxField = 'max_students';
        break;
      case 'homework_check':
        currentField = 'current_homework_checks';
        maxField = 'max_homework_checks';
        break;
      case 'ai_analysis':
        currentField = 'current_ai_analysis';
        maxField = 'max_ai_analysis';
        break;
      case 'similar_problem':
        currentField = 'current_similar_problems';
        maxField = 'max_similar_problems';
        break;
      case 'landing_page':
        currentField = 'current_landing_pages';
        maxField = 'max_landing_pages';
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    currentValue = subscription[currentField] || 0;
    limitValue = subscription[maxField] || 0;
    
    // -1은 무제한
    if (limitValue === -1) {
      if (action === 'increment') {
        const newValue = currentValue + 1;
        await env.DB.prepare(`
          UPDATE user_subscriptions SET ${currentField} = ?, updatedAt = ? WHERE id = ?
        `).bind(newValue, now.toISOString(), subscription.id).run();
        
        return new Response(
          JSON.stringify({
            success: true,
            allowed: true,
            unlimited: true,
            current: newValue
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          allowed: true,
          unlimited: true,
          current: currentValue
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 제한 체크
    if (currentValue >= limitValue) {
      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          error: `${getTypeLabel(type)} 한도를 초과했습니다. (${currentValue}/${limitValue})`,
          code: 'LIMIT_EXCEEDED',
          current: currentValue,
          limit: limitValue,
          type
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 사용량 증가
    if (action === 'increment') {
      const newValue = currentValue + 1;
      await env.DB.prepare(`
        UPDATE user_subscriptions SET ${currentField} = ?, updatedAt = ? WHERE id = ?
      `).bind(newValue, now.toISOString(), subscription.id).run();
      
      // 사용 로그 기록
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await env.DB.prepare(`
        INSERT INTO usage_logs (id, userId, subscriptionId, type, action, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        logId,
        data.userId,
        subscription.id,
        type,
        'use',
        JSON.stringify(data.metadata || {}),
        now.toISOString()
      ).run();
      
      return new Response(
        JSON.stringify({
          success: true,
          allowed: true,
          current: newValue,
          limit: limitValue,
          remaining: limitValue - newValue,
          percentage: Math.round((newValue / limitValue) * 100)
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 체크만 수행
    return new Response(
      JSON.stringify({
        success: true,
        allowed: true,
        current: currentValue,
        limit: limitValue,
        remaining: limitValue - currentValue,
        percentage: Math.round((currentValue / limitValue) * 100)
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Error checking limit:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to check limit',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

function getTypeLabel(type: string): string {
  const labels = {
    'student': '학생 등록',
    'homework_check': '숙제 검사',
    'ai_analysis': 'AI 역량 분석',
    'similar_problem': '유사문제 출제',
    'landing_page': '랜딩페이지 제작'
  };
  return labels[type] || type;
}
