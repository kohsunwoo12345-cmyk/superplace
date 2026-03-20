// Free Plan Application API
interface Env {
  DB: D1Database;
}

function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('🆓 Free Plan Application API called');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Token parsed:', tokenData);

    // Get user from DB
    let user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE id = ?')
      .bind(tokenData.id)
      .first();

    if (!user && tokenData.email) {
      user = await db
        .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
        message: '사용자를 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User found:', user.id);

    // Check if user already has an active subscription
    const existingSubscription = await db
      .prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY endDate DESC LIMIT 1
      `)
      .bind(user.id)
      .first();

    if (existingSubscription) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ALREADY_SUBSCRIBED',
        message: '이미 활성화된 구독이 있습니다.',
        subscription: existingSubscription
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get free plan
    const freePlan = await db
      .prepare(`
        SELECT * FROM pricing_plans 
        WHERE name LIKE '%무료%' OR name LIKE '%Free%' OR price = 0
        ORDER BY price ASC LIMIT 1
      `)
      .first();

    if (!freePlan) {
      return new Response(JSON.stringify({
        success: false,
        error: 'FREE_PLAN_NOT_FOUND',
        message: '무료 플랜을 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Free plan found:', freePlan.id);

    // Create subscription (30 days)
    const now = new Date();
    const kstOffset = 9 * 60; // KST is UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const startDate = kstNow.toISOString().split('T')[0];
    
    const endDateTime = new Date(kstNow);
    endDateTime.setDate(endDateTime.getDate() + 30);
    const endDate = endDateTime.toISOString().split('T')[0];

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    await db
      .prepare(`
        INSERT INTO user_subscriptions (
          id, userId, planId, planName, startDate, endDate, 
          status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
      `)
      .bind(
        subscriptionId,
        user.id,
        freePlan.id,
        freePlan.name,
        startDate,
        endDate
      )
      .run();

    console.log('✅ Subscription created:', subscriptionId);

    return new Response(JSON.stringify({
      success: true,
      message: '무료 플랜이 신청되었습니다!',
      subscription: {
        id: subscriptionId,
        userId: user.id,
        planId: freePlan.id,
        planName: freePlan.name,
        startDate,
        endDate,
        status: 'active'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Free plan application error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '무료 플랜 신청 중 오류가 발생했습니다.',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
