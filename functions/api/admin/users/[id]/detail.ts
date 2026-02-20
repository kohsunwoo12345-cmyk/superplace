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
        .prepare('SELECT id, email, role FROM User WHERE email = ?')
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
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
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

    // Add default values for optional fields
    const user = {
      ...userResult,
      points: 0,
      balance: 0,
      lastLoginAt: userResult.lastLoginAt || null,
      lastLoginIp: userResult.lastLoginIp || null
    };

    console.log('✅ User found:', { id: user.id, email: user.email });

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
      console.log(`✅ Found ${loginLogs.length} login logs`);
    } catch (e) {
      console.log('⚠️ login_logs table not found or error:', e);
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
      console.log(`✅ Found ${activityLogs.length} activity logs`);
    } catch (e) {
      console.log('⚠️ activity_logs table not found or error:', e);
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
      console.log(`✅ Found ${botAssignments.length} bot assignments`);
    } catch (e) {
      console.log('⚠️ bot_assignments table not found or error:', e);
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
