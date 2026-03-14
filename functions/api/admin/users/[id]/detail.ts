interface Env {
  DB: D1Database;
}

// Simple token parser
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
    role: parts[2]
  };
}

// GET: 사용자 상세 정보 + 로그인 기록 + 활동 기록
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env, params } = context;
    const { DB } = env;
    const userId = params.id as string;

    console.log('📊 User detail API called for userId:', userId);

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

    // Parse and validate token
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Invalid token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get requesting user
    let requestingUser;
    try {
      requestingUser = await DB
        .prepare('SELECT id, email, role FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    } catch (dbError: any) {
      console.error('❌ Database error during auth:', dbError);
      throw new Error(`Auth DB error: ${dbError.message}`);
    }

    if (!requestingUser) {
      console.error('❌ Requesting user not found for email:', tokenData.email);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = requestingUser.role ? (requestingUser.role as string).toUpperCase() : '';

    // Only SUPER_ADMIN, ADMIN, and DIRECTOR can access user details
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'DIRECTOR') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Auth passed:', { email: tokenData.email, role });

    // 사용자 정보 조회
    let userResult;
    try {
      userResult = await DB.prepare(`
        SELECT 
          u.id, u.email, u.name, u.phone, u.role,
          u.password,
          u.academyId, a.name as academyName,
          u.createdAt, u.approved, u.grade, u.updatedAt
        FROM users u
        LEFT JOIN academy a ON u.academyId = a.id
        WHERE u.id = ?
      `).bind(userId).first();
    } catch (sqlError: any) {
      console.error('❌ SQL Error fetching user:', sqlError);
      console.error('❌ SQL Error details:', {
        message: sqlError.message,
        stack: sqlError.stack
      });
      throw new Error(`Failed to fetch user: ${sqlError.message}`);
    }

    if (!userResult) {
      console.error('❌ User not found in database:', userId);
      return new Response(JSON.stringify({ 
        error: "User not found",
        userId: userId 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 포인트 조회 (point_transactions 테이블에서 합산)
    let totalPoints = 0;
    try {
      const pointResult = await DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM point_transactions
        WHERE userId = ?
      `).bind(userId).first();
      totalPoints = pointResult?.total || 0;
      console.log(`✅ Total points for user ${userId}: ${totalPoints}`);
    } catch (e: any) {
      console.log('⚠️ Could not fetch points:', e.message);
    }

    // 최근 로그인 정보 조회
    let lastLoginInfo = { lastLoginAt: null, lastLoginIp: null };
    try {
      const lastLogin = await DB.prepare(`
        SELECT loginAt as lastLoginAt, ipAddress as lastLoginIp
        FROM user_login_logs
        WHERE userId = ? AND success = 1
        ORDER BY loginAt DESC
        LIMIT 1
      `).bind(userId).first();
      if (lastLogin) {
        lastLoginInfo = {
          lastLoginAt: lastLogin.lastLoginAt,
          lastLoginIp: lastLogin.lastLoginIp
        };
      }
    } catch (e: any) {
      console.log('⚠️ Could not fetch last login info:', e.message);
    }

    // Add default values for optional fields
    const user = {
      ...userResult,
      points: totalPoints,
      balance: 0,
      lastLoginAt: lastLoginInfo.lastLoginAt,
      lastLoginIp: lastLoginInfo.lastLoginIp
    };

    console.log('✅ User found:', { id: user.id, email: user.email });

    // 로그인 기록 조회 (최근 50개)
    let loginLogs = [];
    try {
      const logs = await DB.prepare(`
        SELECT 
          id, userId, ipAddress as ip, userAgent, 
          success, loginAt
        FROM user_login_logs
        WHERE userId = ?
        ORDER BY loginAt DESC
        LIMIT 50
      `).bind(userId).all();
      loginLogs = logs.results || [];
      console.log(`✅ Found ${loginLogs.length} login logs`);
    } catch (e: any) {
      console.log('⚠️ user_login_logs table error:', e.message);
    }

    // 활동 기록 조회 (최근 100개)
    let activityLogs = [];
    try {
      const activities = await DB.prepare(`
        SELECT 
          id, userId, action, details, ip, createdAt
        FROM ActivityLog
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `).bind(userId).all();
      activityLogs = activities.results || [];
      console.log(`✅ Found ${activityLogs.length} activity logs`);
    } catch (e: any) {
      console.log('⚠️ ActivityLog table error:', e.message);
    }

    // AI 봇 할당 조회
    let botAssignments = [];
    try {
      const bots = await DB.prepare(`
        SELECT 
          ba.id, ba.userId, ba.botId, ba.botName,
          ba.startDate,
          ba.endDate,
          ba.status,
          CASE 
            WHEN ba.status = 'active' AND date(ba.endDate) >= date('now') THEN 1
            ELSE 0
          END as isActive
        FROM ai_bot_assignments ba
        WHERE ba.userId = ?
        ORDER BY ba.createdAt DESC
      `).bind(userId.toString()).all();
      botAssignments = bots.results || [];
      console.log(`✅ Found ${botAssignments.length} bot assignments`);
    } catch (e: any) {
      console.log('⚠️ ai_bot_assignments table error:', e.message);
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
      console.log(`✅ Found ${payments.length} payments`);
    } catch (e) {
      console.log('⚠️ payments table not found or error:', e);
    }

    console.log('✅ Successfully loaded all user data');

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
    console.error("❌ User detail error:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      message: error.message,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch user details",
        message: error.message,
        details: error.stack,
        errorType: error.name
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
