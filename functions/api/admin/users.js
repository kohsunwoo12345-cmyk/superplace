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

    // Allow SUPER_ADMIN, ADMIN, DIRECTOR, and TEACHER
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'DIRECTOR' && role !== 'TEACHER') {
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

    // Build query based on role
    let query = '';
    let queryParams = [];
    
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // Admin can see all users
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          a.name as academyName,
          a.code as academyCode
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        ORDER BY u.id DESC
        LIMIT 1000
      `;
    } else if (role === 'DIRECTOR' || role === 'TEACHER') {
      // Director/Teacher can only see users from their academy
      if (!userAcademyId) {
        console.error('❌ Director/Teacher has no academy assigned');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          a.name as academyName,
          a.code as academyCode
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE u.academyId = ?
        ORDER BY u.id DESC
        LIMIT 1000
      `;
      queryParams = [userAcademyId];
    }

    console.log('📝 Executing query to fetch users for role:', role);

    const result = queryParams.length > 0 
      ? await db.prepare(query).bind(...queryParams).all()
      : await db.prepare(query).all();
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
