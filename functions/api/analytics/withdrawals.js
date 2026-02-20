// Analytics API for withdrawal statistics
// GET /api/analytics/withdrawals

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

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

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
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user info
    const user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    let whereClause = "role = 'STUDENT'";
    let params = [];

    // Filter by academy for directors/teachers
    if (role === 'DIRECTOR' || role === 'TEACHER') {
      if (!user.academyId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      whereClause += " AND academyId = ?";
      params.push(user.academyId);
    }

    // Get total students (active)
    const activeQuery = `SELECT COUNT(*) as count FROM User WHERE ${whereClause} AND (status IS NULL OR status != 'WITHDRAWN')`;
    const activeResult = await (params.length > 0 
      ? db.prepare(activeQuery).bind(...params) 
      : db.prepare(activeQuery)
    ).first();

    // Get withdrawn students
    const withdrawnQuery = `SELECT COUNT(*) as count FROM User WHERE ${whereClause} AND status = 'WITHDRAWN'`;
    const withdrawnResult = await (params.length > 0
      ? db.prepare(withdrawnQuery).bind(...params)
      : db.prepare(withdrawnQuery)
    ).first();

    // Get recent withdrawals (last 30 days)
    const recentQuery = `
      SELECT COUNT(*) as count FROM User 
      WHERE ${whereClause} AND status = 'WITHDRAWN' 
      AND withdrawalDate >= datetime('now', '-30 days')
    `;
    const recentResult = await (params.length > 0
      ? db.prepare(recentQuery).bind(...params)
      : db.prepare(recentQuery)
    ).first();

    // Get withdrawal reasons breakdown
    const reasonsQuery = `
      SELECT withdrawalReason, COUNT(*) as count 
      FROM User 
      WHERE ${whereClause} AND status = 'WITHDRAWN' AND withdrawalReason IS NOT NULL
      GROUP BY withdrawalReason
      ORDER BY count DESC
      LIMIT 10
    `;
    const reasonsResult = await (params.length > 0
      ? db.prepare(reasonsQuery).bind(...params)
      : db.prepare(reasonsQuery)
    ).all();

    return new Response(JSON.stringify({
      success: true,
      stats: {
        activeStudents: activeResult?.count || 0,
        withdrawnStudents: withdrawnResult?.count || 0,
        recentWithdrawals: recentResult?.count || 0,
        totalStudents: (activeResult?.count || 0) + (withdrawnResult?.count || 0),
        withdrawalReasons: reasonsResult.results || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
