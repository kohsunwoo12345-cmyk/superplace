interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const period = url.searchParams.get("period") || "month";
    const academyId = url.searchParams.get("academyId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const searchQuery = url.searchParams.get("search");

    console.log("💰 Revenue API called with:", { period, academyId, startDate, endDate, searchQuery });

    // 매출 테이블이 없으면 생성
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS revenue_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          academyId TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'completed',
          paymentMethod TEXT,
          transactionId TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          paidAt TEXT,
          FOREIGN KEY (academyId) REFERENCES academy(id)
        )
      `).run();
      console.log("✅ Revenue table checked/created");
    } catch (e) {
      console.log("⚠️ Revenue table already exists or error:", e);
    }

    // 날짜 및 검색 필터 조건 구성
    const buildWhereConditions = () => {
      const conditions = ["status = 'completed'"];
      const params: any[] = [];

      if (academyId) {
        conditions.push("r.academyId = ?");
        params.push(academyId);
      }

      if (startDate) {
        conditions.push("date(r.createdAt) >= date(?)");
        params.push(startDate);
      }

      if (endDate) {
        conditions.push("date(r.createdAt) <= date(?)");
        params.push(endDate);
      }

      if (searchQuery) {
        conditions.push("(r.academyId LIKE ? OR a.name LIKE ? OR r.transactionId LIKE ?)");
        const searchPattern = `%${searchQuery}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      return { conditions, params };
    };

    const { conditions: baseConditions, params: baseParams } = buildWhereConditions();

    // 통계 계산
    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let transactionCount = 0;

    // 전체 매출
    const totalResult = await DB.prepare(`
      SELECT SUM(r.amount) as total, COUNT(*) as count
      FROM revenue_records r
      LEFT JOIN academy a ON r.academyId = a.id
      WHERE ${baseConditions.join(' AND ')}
    `).bind(...baseParams).first();

    totalRevenue = totalResult?.total || 0;
    transactionCount = totalResult?.count || 0;

    // 이번 달 매출
    const thisMonthResult = await DB.prepare(`
      SELECT SUM(amount) as total
      FROM revenue_records
      WHERE status = 'completed'
        AND strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')
        ${academyId ? 'AND academyId = ?' : ''}
    `).bind(...(academyId ? [academyId] : [])).first();

    thisMonthRevenue = thisMonthResult?.total || 0;

    // 지난 달 매출
    const lastMonthResult = await DB.prepare(`
      SELECT SUM(amount) as total
      FROM revenue_records
      WHERE status = 'completed'
        AND strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now', '-1 month')
        ${academyId ? 'AND academyId = ?' : ''}
    `).bind(...(academyId ? [academyId] : [])).first();

    lastMonthRevenue = lastMonthResult?.total || 0;

    // 성장률 계산
    const growth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // 최근 거래 내역 (20개)
    const transactionsResult = await DB.prepare(`
      SELECT 
        r.id,
        r.academyId,
        r.amount,
        r.type,
        r.description,
        r.status,
        r.paymentMethod,
        r.createdAt,
        r.paidAt,
        r.transactionId,
        a.name as academyName
      FROM revenue_records r
      LEFT JOIN academy a ON r.academyId = a.id
      WHERE ${baseConditions.join(' AND ')}
      ORDER BY r.createdAt DESC
      LIMIT 20
    `).bind(...baseParams).all();

    const transactions = transactionsResult.results || [];

    // ===== 포인트 충전 매출 추가 =====
    console.log('💰 Fetching Point Charge Revenue...');
    
    let pointQuery = `
      SELECT 
        pcr.id,
        pcr.userId,
        pcr.requestedPoints,
        pcr.pointPrice,
        pcr.vat,
        pcr.totalPrice as amount,
        'POINT_CHARGE' as type,
        '포인트 충전' as description,
        'completed' as status,
        pcr.approvedAt as paidAt,
        pcr.createdAt,
        u.name as userName,
        u.email as userEmail,
        u.academyId,
        a.name as academyName
      FROM PointChargeRequest pcr
      LEFT JOIN User u ON pcr.userId = u.id
      LEFT JOIN academy a ON u.academyId = a.id
      WHERE pcr.status = 'APPROVED'
    `;

    const pointParams: any[] = [];

    if (academyId) {
      pointQuery += ' AND u.academyId = ?';
      pointParams.push(academyId);
    }

    if (startDate) {
      pointQuery += ' AND date(pcr.approvedAt) >= date(?)';
      pointParams.push(startDate);
    }

    if (endDate) {
      pointQuery += ' AND date(pcr.approvedAt) <= date(?)';
      pointParams.push(endDate);
    }

    if (searchQuery) {
      pointQuery += ' AND (u.name LIKE ? OR u.email LIKE ? OR a.name LIKE ?)';
      const searchPattern = `%${searchQuery}%`;
      pointParams.push(searchPattern, searchPattern, searchPattern);
    }

    pointQuery += ' ORDER BY pcr.approvedAt DESC LIMIT 20';

    let pointStmt = DB.prepare(pointQuery);
    if (pointParams.length > 0) {
      pointStmt = pointStmt.bind(...pointParams);
    }

    const { results: pointTransactions } = await pointStmt.all();
    console.log(`✅ Found ${pointTransactions.length} point charge transactions`);

    // ===== AI 쇼핑몰 매출 추가 =====
    console.log('🛒 Fetching AI Shopping Revenue...');

    let botQuery = `
      SELECT 
        bpr.id,
        bpr.userId,
        bpr.academyId,
        bpr.productName as description,
        bpr.studentCount,
        bpr.months,
        bpr.totalPrice as amount,
        'AI_SHOPPING' as type,
        'AI 봇 구독' as category,
        'completed' as status,
        bpr.approvedAt as paidAt,
        bpr.createdAt,
        u.name as userName,
        u.email as userEmail,
        a.name as academyName
      FROM BotPurchaseRequest bpr
      LEFT JOIN User u ON bpr.userId = u.id
      LEFT JOIN academy a ON bpr.academyId = a.id
      WHERE bpr.status = 'APPROVED'
    `;

    const botParams: any[] = [];

    if (academyId) {
      botQuery += ' AND bpr.academyId = ?';
      botParams.push(academyId);
    }

    if (startDate) {
      botQuery += ' AND date(bpr.approvedAt) >= date(?)';
      botParams.push(startDate);
    }

    if (endDate) {
      botQuery += ' AND date(bpr.approvedAt) <= date(?)';
      botParams.push(endDate);
    }

    if (searchQuery) {
      botQuery += ' AND (u.name LIKE ? OR u.email LIKE ? OR a.name LIKE ? OR bpr.productName LIKE ?)';
      const searchPattern = `%${searchQuery}%`;
      botParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    botQuery += ' ORDER BY bpr.approvedAt DESC LIMIT 20';

    let botStmt = DB.prepare(botQuery);
    if (botParams.length > 0) {
      botStmt = botStmt.bind(...botParams);
    }

    const { results: botTransactions } = await botStmt.all();
    console.log(`✅ Found ${botTransactions.length} bot shopping transactions`);

    // ===== 일반 구독 매출 추가 =====
    console.log('📋 Fetching Subscription Revenue...');

    let subscriptionQuery = `
      SELECT 
        sr.id,
        sr.userId,
        sr.finalPrice as amount,
        'SUBSCRIPTION' as type,
        sr.planName as description,
        'completed' as status,
        sr.processedAt as paidAt,
        sr.requestedAt as createdAt,
        u.name as userName,
        u.email as userEmail,
        u.academyId,
        a.name as academyName
      FROM subscription_requests sr
      LEFT JOIN User u ON sr.userId = u.id
      LEFT JOIN academy a ON u.academyId = a.id
      WHERE sr.status = 'approved'
    `;

    const subscriptionParams: any[] = [];

    if (academyId) {
      subscriptionQuery += ' AND u.academyId = ?';
      subscriptionParams.push(academyId);
    }

    if (startDate) {
      subscriptionQuery += ' AND date(sr.processedAt) >= date(?)';
      subscriptionParams.push(startDate);
    }

    if (endDate) {
      subscriptionQuery += ' AND date(sr.processedAt) <= date(?)';
      subscriptionParams.push(endDate);
    }

    if (searchQuery) {
      subscriptionQuery += ' AND (u.name LIKE ? OR u.email LIKE ? OR a.name LIKE ? OR sr.planName LIKE ?)';
      const searchPattern = `%${searchQuery}%`;
      subscriptionParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    subscriptionQuery += ' ORDER BY sr.processedAt DESC LIMIT 20';

    let subscriptionStmt = DB.prepare(subscriptionQuery);
    if (subscriptionParams.length > 0) {
      subscriptionStmt = subscriptionStmt.bind(...subscriptionParams);
    }

    const { results: subscriptionTransactions } = await subscriptionStmt.all();
    console.log(`✅ Found ${subscriptionTransactions.length} subscription transactions`);

    // ===== 매출 통합 및 계산 =====
    const pointRevenue = pointTransactions.reduce((sum, p: any) => sum + (p.amount || 0), 0);
    const pointVAT = pointTransactions.reduce((sum, p: any) => sum + (p.vat || 0), 0);
    const pointNetRevenue = pointRevenue - pointVAT;

    const botRevenue = botTransactions.reduce((sum, b: any) => sum + (b.amount || 0), 0);
    const botVAT = Math.round(botRevenue * 0.1); // 10% VAT
    const botNetRevenue = botRevenue - botVAT;

    const subscriptionRevenue = subscriptionTransactions.reduce((sum, s: any) => sum + (s.amount || 0), 0);
    const subscriptionVAT = Math.round(subscriptionRevenue * 0.1); // 10% VAT
    const subscriptionNetRevenue = subscriptionRevenue - subscriptionVAT;

    // 전체 매출에 포인트, AI 쇼핑몰, 일반 구독 매출 추가
    totalRevenue += pointRevenue + botRevenue + subscriptionRevenue;
    transactionCount += pointTransactions.length + botTransactions.length + subscriptionTransactions.length;

    // 이번 달 포인트/봇/구독 매출
    const thisMonthPoint = pointTransactions.filter((p: any) => {
      const date = new Date(p.paidAt || p.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, p: any) => sum + (p.amount || 0), 0);

    const thisMonthBot = botTransactions.filter((b: any) => {
      const date = new Date(b.paidAt || b.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, b: any) => sum + (b.amount || 0), 0);

    const thisMonthSubscription = subscriptionTransactions.filter((s: any) => {
      const date = new Date(s.paidAt || s.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, s: any) => sum + (s.amount || 0), 0);

    thisMonthRevenue += thisMonthPoint + thisMonthBot + thisMonthSubscription;

    // 전체 거래 목록 통합
    const allTransactions = [
      ...transactions,
      ...pointTransactions,
      ...botTransactions,
      ...subscriptionTransactions
    ].sort((a, b) => {
      const dateA = new Date(a.paidAt || a.createdAt);
      const dateB = new Date(b.paidAt || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 50); // 최신 50개만

    // ===== 학원별 매출 통합 집계 =====
    console.log('🏫 Fetching Academy-wise Revenue Statistics...');

    // 1. 포인트 충전 학원별 집계
    let pointByAcademyQuery = `
      SELECT 
        u.academyId,
        a.name as academyName,
        SUM(pcr.totalPrice) as totalAmount,
        COUNT(*) as transactionCount
      FROM PointChargeRequest pcr
      LEFT JOIN User u ON pcr.userId = u.id
      LEFT JOIN academy a ON u.academyId = a.id
      WHERE pcr.status = 'APPROVED' AND u.academyId IS NOT NULL
    `;

    const pointAcademyParams: any[] = [];
    if (academyId) {
      pointByAcademyQuery += ' AND u.academyId = ?';
      pointAcademyParams.push(academyId);
    }
    if (startDate) {
      pointByAcademyQuery += ' AND date(pcr.approvedAt) >= date(?)';
      pointAcademyParams.push(startDate);
    }
    if (endDate) {
      pointByAcademyQuery += ' AND date(pcr.approvedAt) <= date(?)';
      pointAcademyParams.push(endDate);
    }
    pointByAcademyQuery += ' GROUP BY u.academyId, a.name';

    let pointAcademyStmt = DB.prepare(pointByAcademyQuery);
    if (pointAcademyParams.length > 0) {
      pointAcademyStmt = pointAcademyStmt.bind(...pointAcademyParams);
    }
    const { results: pointByAcademy } = await pointAcademyStmt.all();
    console.log(`  ✅ Point charges by academy: ${pointByAcademy.length} academies`);

    // 2. AI 쇼핑몰 학원별 집계
    let botByAcademyQuery = `
      SELECT 
        bpr.academyId,
        a.name as academyName,
        SUM(bpr.totalPrice) as totalAmount,
        COUNT(*) as transactionCount
      FROM BotPurchaseRequest bpr
      LEFT JOIN academy a ON bpr.academyId = a.id
      WHERE bpr.status = 'APPROVED' AND bpr.academyId IS NOT NULL
    `;

    const botAcademyParams: any[] = [];
    if (academyId) {
      botByAcademyQuery += ' AND bpr.academyId = ?';
      botAcademyParams.push(academyId);
    }
    if (startDate) {
      botByAcademyQuery += ' AND date(bpr.approvedAt) >= date(?)';
      botAcademyParams.push(startDate);
    }
    if (endDate) {
      botByAcademyQuery += ' AND date(bpr.approvedAt) <= date(?)';
      botAcademyParams.push(endDate);
    }
    botByAcademyQuery += ' GROUP BY bpr.academyId, a.name';

    let botAcademyStmt = DB.prepare(botByAcademyQuery);
    if (botAcademyParams.length > 0) {
      botAcademyStmt = botAcademyStmt.bind(...botAcademyParams);
    }
    const { results: botByAcademy } = await botAcademyStmt.all();
    console.log(`  ✅ Bot purchases by academy: ${botByAcademy.length} academies`);

    // 3. 일반 구독 학원별 집계
    let subscriptionByAcademyQuery = `
      SELECT 
        u.academyId,
        a.name as academyName,
        SUM(sr.finalPrice) as totalAmount,
        COUNT(*) as transactionCount
      FROM subscription_requests sr
      LEFT JOIN User u ON sr.userId = u.id
      LEFT JOIN academy a ON u.academyId = a.id
      WHERE sr.status = 'approved' AND u.academyId IS NOT NULL
    `;

    const subAcademyParams: any[] = [];
    if (academyId) {
      subscriptionByAcademyQuery += ' AND u.academyId = ?';
      subAcademyParams.push(academyId);
    }
    if (startDate) {
      subscriptionByAcademyQuery += ' AND date(sr.processedAt) >= date(?)';
      subAcademyParams.push(startDate);
    }
    if (endDate) {
      subscriptionByAcademyQuery += ' AND date(sr.processedAt) <= date(?)';
      subAcademyParams.push(endDate);
    }
    subscriptionByAcademyQuery += ' GROUP BY u.academyId, a.name';

    let subAcademyStmt = DB.prepare(subscriptionByAcademyQuery);
    if (subAcademyParams.length > 0) {
      subAcademyStmt = subAcademyStmt.bind(...subAcademyParams);
    }
    const { results: subscriptionByAcademy } = await subAcademyStmt.all();
    console.log(`  ✅ Subscriptions by academy: ${subscriptionByAcademy.length} academies`);

    // 4. revenue_records 학원별 집계
    const revenueRecordsResult = await DB.prepare(`
      SELECT 
        r.academyId,
        a.name as academyName,
        SUM(r.amount) as totalAmount,
        COUNT(*) as transactionCount
      FROM revenue_records r
      LEFT JOIN academy a ON r.academyId = a.id
      WHERE r.status = 'completed'
      GROUP BY r.academyId, a.name
    `).all();
    const revenueByAcademy = revenueRecordsResult.results || [];
    console.log(`  ✅ Revenue records by academy: ${revenueByAcademy.length} academies`);

    // 5. 학원별로 통합
    const academyMap = new Map();
    
    // 포인트 충전 매출 추가
    (pointByAcademy as any[]).forEach((item: any) => {
      if (!item.academyId) return;
      if (!academyMap.has(item.academyId)) {
        academyMap.set(item.academyId, {
          academyId: item.academyId,
          academyName: item.academyName || item.academyId,
          totalAmount: 0,
          transactionCount: 0,
          pointAmount: 0,
          botAmount: 0,
          subscriptionAmount: 0,
          otherAmount: 0
        });
      }
      const data = academyMap.get(item.academyId);
      data.totalAmount += item.totalAmount || 0;
      data.transactionCount += item.transactionCount || 0;
      data.pointAmount += item.totalAmount || 0;
    });

    // AI 쇼핑몰 매출 추가
    (botByAcademy as any[]).forEach((item: any) => {
      if (!item.academyId) return;
      if (!academyMap.has(item.academyId)) {
        academyMap.set(item.academyId, {
          academyId: item.academyId,
          academyName: item.academyName || item.academyId,
          totalAmount: 0,
          transactionCount: 0,
          pointAmount: 0,
          botAmount: 0,
          subscriptionAmount: 0,
          otherAmount: 0
        });
      }
      const data = academyMap.get(item.academyId);
      data.totalAmount += item.totalAmount || 0;
      data.transactionCount += item.transactionCount || 0;
      data.botAmount += item.totalAmount || 0;
    });

    // 일반 구독 매출 추가
    (subscriptionByAcademy as any[]).forEach((item: any) => {
      if (!item.academyId) return;
      if (!academyMap.has(item.academyId)) {
        academyMap.set(item.academyId, {
          academyId: item.academyId,
          academyName: item.academyName || item.academyId,
          totalAmount: 0,
          transactionCount: 0,
          pointAmount: 0,
          botAmount: 0,
          subscriptionAmount: 0,
          otherAmount: 0
        });
      }
      const data = academyMap.get(item.academyId);
      data.totalAmount += item.totalAmount || 0;
      data.transactionCount += item.transactionCount || 0;
      data.subscriptionAmount += item.totalAmount || 0;
    });

    // 기타 매출 추가
    (revenueByAcademy as any[]).forEach((item: any) => {
      if (!item.academyId) return;
      if (!academyMap.has(item.academyId)) {
        academyMap.set(item.academyId, {
          academyId: item.academyId,
          academyName: item.academyName || item.academyId,
          totalAmount: 0,
          transactionCount: 0,
          pointAmount: 0,
          botAmount: 0,
          subscriptionAmount: 0,
          otherAmount: 0
        });
      }
      const data = academyMap.get(item.academyId);
      data.totalAmount += item.totalAmount || 0;
      data.transactionCount += item.transactionCount || 0;
      data.otherAmount += item.totalAmount || 0;
    });

    // 6. 정렬 및 상위 10개 추출
    const academyStats = Array.from(academyMap.values())
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    console.log(`✅ Total academies with revenue: ${academyMap.size}`);
    console.log(`✅ Top 10 academies prepared for response`);

    // 월별 매출 추이 (최근 12개월)
    const monthlyTrendResult = await DB.prepare(`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM revenue_records
      WHERE status = 'completed'
        AND createdAt >= date('now', '-12 months')
        ${academyId ? 'AND academyId = ?' : ''}
      GROUP BY month
      ORDER BY month DESC
    `).bind(...(academyId ? [academyId] : [])).all();

    let monthlyTrend = monthlyTrendResult.results || [];

    // 포인트, 봇, 구독 매출을 월별 트렌드에 추가
    const monthlyMap = new Map();
    monthlyTrend.forEach((m: any) => {
      monthlyMap.set(m.month, { 
        month: m.month, 
        total: m.total || 0, 
        count: m.count || 0,
        point: 0,
        bot: 0,
        subscription: 0
      });
    });

    pointTransactions.forEach((p: any) => {
      const month = (p.paidAt || p.createdAt).substring(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, total: 0, count: 0, point: 0, bot: 0, subscription: 0 });
      }
      const data = monthlyMap.get(month);
      data.total += p.amount || 0;
      data.count += 1;
      data.point += p.amount || 0;
    });

    botTransactions.forEach((b: any) => {
      const month = (b.paidAt || b.createdAt).substring(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, total: 0, count: 0, point: 0, bot: 0, subscription: 0 });
      }
      const data = monthlyMap.get(month);
      data.total += b.amount || 0;
      data.count += 1;
      data.bot += b.amount || 0;
    });

    subscriptionTransactions.forEach((s: any) => {
      const month = (s.paidAt || s.createdAt).substring(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, total: 0, count: 0, point: 0, bot: 0, subscription: 0 });
      }
      const data = monthlyMap.get(month);
      data.total += s.amount || 0;
      data.count += 1;
      data.subscription += s.amount || 0;
    });
      const data = monthlyMap.get(month);
      data.total += b.amount || 0;
      data.count += 1;
      data.bot += b.amount || 0;
    });

    monthlyTrend = Array.from(monthlyMap.values()).sort((a, b) => b.month.localeCompare(a.month));

    // 유형별 매출
    const typeStatsResult = await DB.prepare(`
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM revenue_records
      WHERE status = 'completed'
        ${academyId ? 'AND academyId = ?' : ''}
      GROUP BY type
      ORDER BY total DESC
    `).bind(...(academyId ? [academyId] : [])).all();

    let typeStats: any[] = typeStatsResult.results || [];

    // 포인트 충전, AI 쇼핑몰, 일반 구독 매출을 유형별 통계에 추가
    if (pointTransactions.length > 0) {
      typeStats.push({
        type: 'POINT_CHARGE',
        total: pointRevenue,
        count: pointTransactions.length
      });
    }

    if (botTransactions.length > 0) {
      typeStats.push({
        type: 'AI_SHOPPING',
        total: botRevenue,
        count: botTransactions.length
      });
    }

    if (subscriptionTransactions.length > 0) {
      typeStats.push({
        type: 'SUBSCRIPTION',
        total: subscriptionRevenue,
        count: subscriptionTransactions.length
      });
    }

    typeStats = typeStats.sort((a, b) => b.total - a.total);

    // VAT 정보 추가
    const vatInfo = {
      totalVAT: pointVAT + botVAT + subscriptionVAT,
      pointVAT,
      botVAT,
      subscriptionVAT,
      totalNetRevenue: totalRevenue - (pointVAT + botVAT + subscriptionVAT),
      pointNetRevenue,
      botNetRevenue,
      subscriptionNetRevenue
    };

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        growth: parseFloat(growth),
        transactionCount,
        pointRevenue,
        botRevenue,
        subscriptionRevenue,
        regularRevenue: totalRevenue - pointRevenue - botRevenue - subscriptionRevenue
      },
      vatInfo,
      transactions: allTransactions,
      academyStats,
      monthlyTrend,
      typeStats,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Revenue API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to fetch revenue data",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 샘플 데이터 생성 API
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🎲 Generating sample revenue data...");

    // 학원 목록 가져오기
    const academiesResult = await DB.prepare(`
      SELECT id, name FROM academy LIMIT 10
    `).all();

    const academies = academiesResult.results || [];

    if (academies.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "No academies found. Please create academies first."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const types = ['subscription', 'tuition', 'materials', 'events', 'other'];
    const statuses = ['completed', 'pending', 'cancelled'];
    const methods = ['card', 'transfer', 'cash'];

    // 샘플 데이터 100개 생성
    for (let i = 0; i < 100; i++) {
      const academy = academies[Math.floor(Math.random() * academies.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const amount = Math.floor(Math.random() * 500000) + 50000;

      // 랜덤 날짜 (최근 6개월)
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));

      await DB.prepare(`
        INSERT INTO revenue_records 
        (academyId, amount, type, description, status, paymentMethod, transactionId, createdAt, paidAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        academy.id,
        amount,
        type,
        `${type} - ${academy.name}`,
        status,
        method,
        `TXN-${Date.now()}-${i}`,
        date.toISOString(),
        status === 'completed' ? date.toISOString() : null
      ).run();
    }

    console.log("✅ Sample data generated");

    return new Response(JSON.stringify({
      success: true,
      message: "Sample revenue data generated successfully",
      count: 100
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Sample data generation error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to generate sample data",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
