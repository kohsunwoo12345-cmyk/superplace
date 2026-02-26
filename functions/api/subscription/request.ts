// 요금제 신청 API
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  
  try {
    const method = request.method;
    
    // POST: 요금제 신청
    if (method === 'POST') {
      const data = await request.json();
      
      // 필수 필드 검증
      if (!data.userId || !data.planId || !data.period || !data.paymentMethod) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Required fields missing: userId, planId, period, paymentMethod' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // 요금제 정보 조회
      const plan = await env.DB.prepare(`
        SELECT * FROM pricing_plans WHERE id = ? AND isActive = 1
      `).bind(data.planId).first();
      
      if (!plan) {
        return new Response(
          JSON.stringify({ success: false, error: 'Plan not found or inactive' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // 가격 계산
      const priceField = `price_${data.period.replace('months', 'months').replace('month', '1month')}`;
      const finalPrice = plan[priceField] || 0;
      
      // 신청 ID 생성
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      // 결제 정보 처리
      const paymentInfo = data.paymentInfo || {};
      
      // DB에 신청 정보 저장
      await env.DB.prepare(`
        INSERT INTO subscription_requests (
          id, userId, userEmail, userName,
          planId, planName, period, paymentMethod,
          originalPrice, discountedPrice, finalPrice,
          paymentInfo, status, requestedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        requestId,
        data.userId,
        data.userEmail,
        data.userName,
        data.planId,
        plan.name,
        data.period,
        data.paymentMethod,
        finalPrice,
        0,
        finalPrice,
        JSON.stringify(paymentInfo),
        'pending',
        now
      ).run();
      
      return new Response(
        JSON.stringify({
          success: true,
          requestId,
          message: '요금제 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
          data: {
            planName: plan.name,
            period: data.period,
            finalPrice,
            paymentMethod: data.paymentMethod
          }
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // GET: 내 신청 목록 조회
    if (method === 'GET') {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'userId is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const { results } = await env.DB.prepare(`
        SELECT * FROM subscription_requests 
        WHERE userId = ? 
        ORDER BY requestedAt DESC
      `).bind(userId).all();
      
      return new Response(
        JSON.stringify({
          success: true,
          requests: results || []
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error processing subscription request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process subscription request',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
