// Admin Users API - JavaScript version with token authentication

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

    console.log('👥 Admin Users API called');

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
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from database
    const user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      console.error('❌ User not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    const userAcademyId = user.academyId;

    console.log('✅ User verified:', { email: user.email, role, academyId: userAcademyId });

    // Only SUPER_ADMIN and ADMIN can access this API
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '관리자 권한이 필요합니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all users with academy information
    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.academyId,
        u.grade,
        u.approved,
        u.createdAt,
        u.updatedAt,
        a.name as academyName,
        a.code as academyCode
      FROM User u
      LEFT JOIN Academy a ON u.academyId = a.id
      ORDER BY u.createdAt DESC
      LIMIT 1000
    `;

    console.log('📝 Executing query to fetch all users');

    const result = await db.prepare(query).all();
    const users = result.results || [];

    console.log(`✅ Users fetched: ${users.length} users`);

    return new Response(JSON.stringify({ 
      success: true, 
      users: users,
      count: users.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Admin Users API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '사용자 목록을 불러오는 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
