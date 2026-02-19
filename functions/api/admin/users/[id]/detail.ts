interface Env {
  DB: D1Database;
}

// GET: 사용자 상세 정보 + 로그인 기록 + 활동 기록
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 사용자 정보 조회
    const user = await DB.prepare(`
      SELECT 
        u.id, u.email, u.name, u.phone, u.role,
        u.password, u.points, u.balance,
        u.academyId, a.name as academyName,
        u.createdAt, u.lastLoginAt, u.lastLoginIP as lastLoginIp,
        u.approved
      FROM User u
      LEFT JOIN Academy a ON u.academyId = a.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 로그인 기록 조회 (최근 50개)
    let loginLogs = [];
    try {
      const logs = await DB.prepare(`
        SELECT 
          id, userId, ipAddress as ip, userAgent, 
          success, loginAt
        FROM login_logs
        WHERE userId = ?
        ORDER BY loginAt DESC
        LIMIT 50
      `).bind(userId).all();
      loginLogs = logs.results || [];
    } catch (e) {
      console.log('⚠️ login_logs table not found');
    }

    // 활동 기록 조회 (최근 100개)
    let activityLogs = [];
    try {
      const activities = await DB.prepare(`
        SELECT 
          id, userId, action, details, ipAddress as ip, createdAt
        FROM activity_logs
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `).bind(userId).all();
      activityLogs = activities.results || [];
    } catch (e) {
      console.log('⚠️ activity_logs table not found');
    }

    // AI 봇 할당 조회
    let botAssignments = [];
    try {
      const bots = await DB.prepare(`
        SELECT 
          ba.id, ba.userId, ba.botId, 
          b.name as botName,
          ba.createdAt as startDate,
          ba.expiresAt as endDate,
          ba.isActive
        FROM bot_assignments ba
        JOIN ai_bots b ON ba.botId = b.id
        WHERE ba.userId = ?
        ORDER BY ba.createdAt DESC
      `).bind(userId).all();
      botAssignments = bots.results || [];
    } catch (e) {
      console.log('⚠️ bot_assignments table not found');
    }

    // 결제 내역 조회
    let payments = [];
    try {
      const paymentData = await DB.prepare(`
        SELECT 
          id, userId, productName, amount, status, paidAt
        FROM payments
        WHERE userId = ?
        ORDER BY paidAt DESC
        LIMIT 50
      `).bind(userId).all();
      payments = paymentData.results || [];
    } catch (e) {
      console.log('⚠️ payments table not found');
    }

    return new Response(
      JSON.stringify({
        success: true,
        user,
        loginLogs,
        activityLogs,
        botAssignments,
        payments,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("User detail error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch user details",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
