// 학원의 AI 봇 구독 상태 조회 API
export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized - No token provided' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰으로 사용자 조회
    const user = await env.DB.prepare(
      'SELECT id, email, name, role, academyId FROM Users WHERE token = ?'
    ).bind(token).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학원 ID 확인
    if (!user.academyId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No academy assigned',
        message: '학원이 배정되지 않았습니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // URL 파라미터에서 productId 가져오기 (선택사항)
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');

    let query = `
      SELECT 
        s.*,
        p.name as productName,
        p.description as productDescription
      FROM AcademyBotSubscription s
      LEFT JOIN StoreProducts p ON s.productId = p.id
      WHERE s.academyId = ?
    `;
    
    const params: any[] = [user.academyId];
    
    if (productId) {
      query += ' AND s.productId = ?';
      params.push(productId);
    }
    
    query += ' ORDER BY s.subscriptionEnd DESC';

    // 구독 정보 조회
    let stmt = env.DB.prepare(query);
    stmt = stmt.bind(...params);
    
    const { results: subscriptions } = await stmt.all();

    // 각 구독에 대한 추가 정보 계산
    const now = new Date();
    const enrichedSubscriptions = subscriptions.map((sub: any) => {
      const subscriptionEnd = new Date(sub.subscriptionEnd);
      const isExpired = subscriptionEnd < now;
      const daysRemaining = Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...sub,
        isExpired,
        daysRemaining: isExpired ? 0 : daysRemaining,
        usagePercentage: sub.totalStudentSlots > 0 
          ? Math.round((sub.usedStudentSlots / sub.totalStudentSlots) * 100)
          : 0
      };
    });

    // 전체 통계 계산
    const stats = {
      totalSubscriptions: enrichedSubscriptions.length,
      activeSubscriptions: enrichedSubscriptions.filter((s: any) => !s.isExpired).length,
      expiredSubscriptions: enrichedSubscriptions.filter((s: any) => s.isExpired).length,
      totalSlots: enrichedSubscriptions.reduce((sum: number, s: any) => sum + (s.totalStudentSlots || 0), 0),
      usedSlots: enrichedSubscriptions.reduce((sum: number, s: any) => sum + (s.usedStudentSlots || 0), 0),
      remainingSlots: enrichedSubscriptions.reduce((sum: number, s: any) => sum + (s.remainingStudentSlots || 0), 0)
    };

    return new Response(JSON.stringify({
      success: true,
      data: {
        subscriptions: enrichedSubscriptions,
        stats
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Get academy subscriptions error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch subscriptions'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
