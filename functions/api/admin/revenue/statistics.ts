import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

// Token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

// GET: 매출 통계 조회 (포인트 충전 + AI 쇼핑몰 매출 포함)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ADMIN 또는 SUPER_ADMIN만 조회 가능
    if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can view revenue' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    console.log('📊 Fetching revenue statistics');

    // 1. 포인트 충전 매출 (APPROVED만)
    let pointQuery = `
      SELECT 
        id,
        userId,
        requestedPoints,
        pointPrice,
        vat,
        totalPrice,
        status,
        approvedAt as paidAt,
        createdAt,
        'POINT_CHARGE' as type,
        '포인트 충전' as description
      FROM PointChargeRequest
      WHERE status = 'APPROVED'
    `;

    const pointParams: any[] = [];

    if (startDate) {
      pointQuery += ' AND approvedAt >= ?';
      pointParams.push(startDate);
    }

    if (endDate) {
      pointQuery += ' AND approvedAt <= ?';
      pointParams.push(endDate);
    }

    let pointStmt = env.DB.prepare(pointQuery);
    if (pointParams.length > 0) {
      pointStmt = pointStmt.bind(...pointParams);
    }

    const { results: pointCharges } = await pointStmt.all();

    console.log('💰 Point charges:', pointCharges.length);

    // 2. AI 쇼핑몰 매출 (APPROVED만)
    let botQuery = `
      SELECT 
        bpr.id,
        bpr.userId,
        bpr.academyId,
        bpr.productName as description,
        bpr.studentCount,
        bpr.months,
        bpr.totalPrice,
        bpr.status,
        bpr.approvedAt as paidAt,
        bpr.createdAt,
        'AI_SHOPPING' as type,
        u.name as userName,
        u.email as userEmail,
        a.name as academyName
      FROM BotPurchaseRequest bpr
      LEFT JOIN users u ON bpr.userId = u.id
      LEFT JOIN Academy a ON bpr.academyId = a.id
      WHERE bpr.status = 'APPROVED'
    `;

    const botParams: any[] = [];

    if (startDate) {
      botQuery += ' AND bpr.approvedAt >= ?';
      botParams.push(startDate);
    }

    if (endDate) {
      botQuery += ' AND bpr.approvedAt <= ?';
      botParams.push(endDate);
    }

    let botStmt = env.DB.prepare(botQuery);
    if (botParams.length > 0) {
      botStmt = botStmt.bind(...botParams);
    }

    const { results: botPurchases } = await botStmt.all();

    console.log('🛒 Bot purchases:', botPurchases.length);

    // 3. 통합 매출 계산
    const pointRevenue = pointCharges.reduce((sum: number, p: any) => sum + (p.totalPrice || 0), 0);
    const pointVAT = pointCharges.reduce((sum: number, p: any) => sum + (p.vat || 0), 0);
    const pointNetRevenue = pointRevenue - pointVAT;

    const botRevenue = botPurchases.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
    const botVAT = Math.round(botRevenue * 0.1); // 10% VAT
    const botNetRevenue = botRevenue - botVAT;

    const totalRevenue = pointRevenue + botRevenue;
    const totalVAT = pointVAT + botVAT;
    const totalNetRevenue = totalRevenue - totalVAT;

    // 4. 월별 트렌드
    const monthlyData: { [key: string]: { point: number; bot: number } } = {};

    pointCharges.forEach((p: any) => {
      const month = p.paidAt ? p.paidAt.substring(0, 7) : p.createdAt.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { point: 0, bot: 0 };
      }
      monthlyData[month].point += p.totalPrice || 0;
    });

    botPurchases.forEach((b: any) => {
      const month = b.paidAt ? b.paidAt.substring(0, 7) : b.createdAt.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { point: 0, bot: 0 };
      }
      monthlyData[month].bot += b.totalPrice || 0;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        pointRevenue: data.point,
        botRevenue: data.bot,
        total: data.point + data.bot
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 5. 일별 매출 (최근 30일)
    const dailyData: { [key: string]: { point: number; bot: number } } = {};

    pointCharges.forEach((p: any) => {
      const date = p.paidAt ? p.paidAt.substring(0, 10) : p.createdAt.substring(0, 10);
      if (!dailyData[date]) {
        dailyData[date] = { point: 0, bot: 0 };
      }
      dailyData[date].point += p.totalPrice || 0;
    });

    botPurchases.forEach((b: any) => {
      const date = b.paidAt ? b.paidAt.substring(0, 10) : b.createdAt.substring(0, 10);
      if (!dailyData[date]) {
        dailyData[date] = { point: 0, bot: 0 };
      }
      dailyData[date].bot += b.totalPrice || 0;
    });

    const dailyTrend = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        pointRevenue: data.point,
        botRevenue: data.bot,
        total: data.point + data.bot
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 최근 30일

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalRevenue,
        totalVAT,
        totalNetRevenue,
        pointRevenue,
        pointVAT,
        pointNetRevenue,
        botRevenue,
        botVAT,
        botNetRevenue,
        pointCount: pointCharges.length,
        botCount: botPurchases.length
      },
      monthlyTrend,
      dailyTrend,
      pointCharges,
      botPurchases
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch revenue statistics:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch revenue',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
