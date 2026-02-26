// DB 마이그레이션 실행 API (관리자 전용)
export const onRequest: PagesFunction = async (context) => {
  const { env } = context;
  
  try {
    console.log('Starting subscription system migration...');
    
    // 1. pricing_plans 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price_1month INTEGER NOT NULL DEFAULT 0,
        price_6months INTEGER NOT NULL DEFAULT 0,
        price_12months INTEGER NOT NULL DEFAULT 0,
        max_students INTEGER NOT NULL DEFAULT 10,
        max_homework_checks INTEGER NOT NULL DEFAULT 100,
        max_ai_analysis INTEGER NOT NULL DEFAULT 50,
        max_similar_problems INTEGER NOT NULL DEFAULT 100,
        max_landing_pages INTEGER NOT NULL DEFAULT 3,
        features TEXT,
        isPopular INTEGER DEFAULT 0,
        color TEXT DEFAULT '#3b82f6',
        \`order\` INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    
    console.log('✅ pricing_plans table created');
    
    // 2. subscription_requests 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_requests (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        userName TEXT NOT NULL,
        planId TEXT NOT NULL,
        planName TEXT NOT NULL,
        period TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        originalPrice INTEGER NOT NULL,
        discountedPrice INTEGER DEFAULT 0,
        finalPrice INTEGER NOT NULL,
        paymentInfo TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        adminNote TEXT,
        requestedAt TEXT NOT NULL DEFAULT (datetime('now')),
        processedAt TEXT,
        approvedBy TEXT,
        approvedByEmail TEXT
      )
    `).run();
    
    console.log('✅ subscription_requests table created');
    
    // 3. user_subscriptions 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        planId TEXT NOT NULL,
        planName TEXT NOT NULL,
        period TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        current_students INTEGER DEFAULT 0,
        current_homework_checks INTEGER DEFAULT 0,
        current_ai_analysis INTEGER DEFAULT 0,
        current_similar_problems INTEGER DEFAULT 0,
        current_landing_pages INTEGER DEFAULT 0,
        max_students INTEGER NOT NULL DEFAULT 10,
        max_homework_checks INTEGER NOT NULL DEFAULT 100,
        max_ai_analysis INTEGER NOT NULL DEFAULT 50,
        max_similar_problems INTEGER NOT NULL DEFAULT 100,
        max_landing_pages INTEGER NOT NULL DEFAULT 3,
        lastPaymentAmount INTEGER DEFAULT 0,
        lastPaymentDate TEXT,
        autoRenew INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        lastResetDate TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    
    console.log('✅ user_subscriptions table created');
    
    // 4. usage_logs 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        subscriptionId TEXT NOT NULL,
        type TEXT NOT NULL,
        action TEXT NOT NULL,
        metadata TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    
    console.log('✅ usage_logs table created');
    
    // 5. 인덱스 생성
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(isActive)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON subscription_requests(userId)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(userId)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(userId)`).run();
    
    console.log('✅ Indexes created');
    
    // 6. 기본 요금제 데이터 삽입
    const now = new Date().toISOString();
    
    const plans = [
      {
        id: 'plan-free',
        name: '무료 플랜',
        description: '개인 사용자를 위한 무료 플랜',
        price_1month: 0,
        price_6months: 0,
        price_12months: 0,
        max_students: 5,
        max_homework_checks: 10,
        max_ai_analysis: 5,
        max_similar_problems: 10,
        max_landing_pages: 1,
        features: JSON.stringify(['기본 숙제 검사', '제한된 AI 분석', '1개 랜딩페이지']),
        isPopular: 0,
        color: '#gray-500',
        order: 1
      },
      {
        id: 'plan-starter',
        name: '스타터',
        description: '소규모 학원을 위한 시작 플랜',
        price_1month: 50000,
        price_6months: 270000,
        price_12months: 480000,
        max_students: 30,
        max_homework_checks: 100,
        max_ai_analysis: 50,
        max_similar_problems: 100,
        max_landing_pages: 3,
        features: JSON.stringify(['30명 학생 관리', '월 100회 숙제 검사', '월 50회 AI 분석', '3개 랜딩페이지']),
        isPopular: 0,
        color: '#3b82f6',
        order: 2
      },
      {
        id: 'plan-pro',
        name: '프로',
        description: '중규모 학원을 위한 추천 플랜',
        price_1month: 100000,
        price_6months: 540000,
        price_12months: 960000,
        max_students: 100,
        max_homework_checks: 500,
        max_ai_analysis: 200,
        max_similar_problems: 500,
        max_landing_pages: 10,
        features: JSON.stringify(['100명 학생 관리', '월 500회 숙제 검사', '월 200회 AI 분석', '10개 랜딩페이지']),
        isPopular: 1,
        color: '#8b5cf6',
        order: 3
      },
      {
        id: 'plan-enterprise',
        name: '엔터프라이즈',
        description: '대규모 학원을 위한 맞춤 플랜',
        price_1month: 200000,
        price_6months: 1080000,
        price_12months: 1920000,
        max_students: -1,
        max_homework_checks: -1,
        max_ai_analysis: -1,
        max_similar_problems: -1,
        max_landing_pages: -1,
        features: JSON.stringify(['무제한 학생', '무제한 숙제 검사', '무제한 AI 분석', '무제한 랜딩페이지']),
        isPopular: 0,
        color: '#f59e0b',
        order: 4
      }
    ];
    
    for (const plan of plans) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO pricing_plans (
          id, name, description, price_1month, price_6months, price_12months,
          max_students, max_homework_checks, max_ai_analysis, max_similar_problems, max_landing_pages,
          features, isPopular, color, \`order\`, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        plan.id, plan.name, plan.description,
        plan.price_1month, plan.price_6months, plan.price_12months,
        plan.max_students, plan.max_homework_checks, plan.max_ai_analysis,
        plan.max_similar_problems, plan.max_landing_pages,
        plan.features, plan.isPopular, plan.color, plan.order, 1, now, now
      ).run();
    }
    
    console.log('✅ Default pricing plans inserted');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription system migration completed successfully',
        tables: ['pricing_plans', 'subscription_requests', 'user_subscriptions', 'usage_logs'],
        plans: plans.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Migration failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
