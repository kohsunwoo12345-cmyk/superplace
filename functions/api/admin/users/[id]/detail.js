// Simple token parser
function parseToken(authHeader) {
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
export async function onRequestGet(context) {
  try {
    const { request, env, params } = context;
    const { DB } = env;
    const userId = params.id;

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
    } catch (dbError) {
      console.error('❌ Database error during auth:', dbError);
      throw new Error(`Auth DB error: ${dbError.message}`);
    }

    // If user not found in DB but has valid token, use token data
    if (!requestingUser) {
      console.log('⚠️ User not found in DB, using token data:', tokenData.email);
      requestingUser = {
        id: tokenData.id,
        email: tokenData.email,
        role: tokenData.role
      };
    }

    const role = requestingUser.role ? requestingUser.role.toUpperCase() : '';

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

    // Fetch user details with LEFT JOIN to academy
    const userQuery = `
      SELECT 
        u.*,
        a.id as academyId,
        a.name as academyName
      FROM users u
      LEFT JOIN academy a ON u.academyId = a.id
      WHERE u.id = ?
    `;
    
    const user = await DB.prepare(userQuery).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch login logs (last 20)
    const loginLogsQuery = `
      SELECT * FROM login_logs 
      WHERE userId = ? 
      ORDER BY loginAt DESC 
      LIMIT 20
    `;
    const { results: loginLogs } = await DB.prepare(loginLogsQuery).bind(userId).all();

    // Fetch activity logs (last 50)
    const activityLogsQuery = `
      SELECT * FROM activity_logs 
      WHERE userId = ? 
      ORDER BY timestamp DESC 
      LIMIT 50
    `;
    const { results: activityLogs } = await DB.prepare(activityLogsQuery).bind(userId).all();

    // Fetch AI bot assignments
    const botAssignmentsQuery = `
      SELECT * FROM academy_bot_assignments 
      WHERE userId = ? 
      ORDER BY assignedAt DESC
    `;
    const { results: botAssignments } = await DB.prepare(botAssignmentsQuery).bind(userId).all();

    // Fetch payment history
    const paymentsQuery = `
      SELECT * FROM payments 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT 20
    `;
    const { results: payments } = await DB.prepare(paymentsQuery).bind(userId).all();

    return new Response(JSON.stringify({
      success: true,
      data: {
        user,
        loginLogs: loginLogs || [],
        activityLogs: activityLogs || [],
        botAssignments: botAssignments || [],
        payments: payments || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ User detail API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
