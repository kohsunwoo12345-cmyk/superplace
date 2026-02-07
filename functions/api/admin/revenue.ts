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

    // 학원별 매출 통계
    const academyStatsResult = await DB.prepare(`
      SELECT 
        r.academyId,
        a.name as academyName,
        SUM(r.amount) as totalAmount,
        COUNT(*) as transactionCount
      FROM revenue_records r
      LEFT JOIN academy a ON r.academyId = a.id
      WHERE r.status = 'completed'
      GROUP BY r.academyId, a.name
      ORDER BY totalAmount DESC
      LIMIT 10
    `).all();

    const academyStats = academyStatsResult.results || [];

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

    const monthlyTrend = monthlyTrendResult.results || [];

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

    const typeStats = typeStatsResult.results || [];

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        growth: parseFloat(growth),
        transactionCount,
      },
      transactions,
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

    // 샘플 데이터 생성
    const types = ["구독료", "추가 기능", "프리미엄", "연간 구독", "업그레이드"];
    const amounts = [150000, 200000, 300000, 500000, 1000000];
    
    let insertedCount = 0;

    // 각 학원에 대해 랜덤 거래 생성 (최근 6개월)
    for (const academy of academies) {
      const transactionCount = Math.floor(Math.random() * 5) + 3; // 3-7 거래
      
      for (let i = 0; i < transactionCount; i++) {
        const daysAgo = Math.floor(Math.random() * 180); // 0-180일 전
        const type = types[Math.floor(Math.random() * types.length)];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        
        await DB.prepare(`
          INSERT INTO revenue_records 
          (academyId, amount, type, description, status, paymentMethod, createdAt, paidAt)
          VALUES (?, ?, ?, ?, 'completed', 'card', datetime('now', '-${daysAgo} days'), datetime('now', '-${daysAgo} days'))
        `).bind(
          academy.id,
          amount,
          type,
          `${academy.name} - ${type} 결제`
        ).run();
        
        insertedCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully generated ${insertedCount} sample revenue records for ${academies.length} academies`,
      insertedCount,
      academyCount: academies.length,
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
