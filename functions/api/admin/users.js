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

    console.log('✅ User verified:', { 
      email: user.email, 
      role, 
      academyId: userAcademyId,
      userId: user.id 
    });

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

    // Parse query parameters
    const url = new URL(request.url);
    const queryAcademyId = url.searchParams.get('academyId');
    const queryRole = url.searchParams.get('role');

    console.log('📋 Query params:', { academyId: queryAcademyId, role: queryRole });

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
          u.isWithdrawn,
          a.name as academyName,
          a.code as academyCode
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE 1=1
      `;
      
      // Filter by academyId if provided
      if (queryAcademyId) {
        query += ' AND u.academyId = ?';
        queryParams.push(queryAcademyId);
        console.log('🏫 Filtering by academyId:', queryAcademyId);
      }
      
      // Filter by role if provided
      if (queryRole) {
        query += ' AND u.role = ?';
        queryParams.push(queryRole);
        console.log('👤 Filtering by role:', queryRole);
      }
      
      // Exclude withdrawn students
      query += ' AND (u.isWithdrawn IS NULL OR u.isWithdrawn = 0)';
      
      query += ' ORDER BY u.id DESC LIMIT 1000';
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
          u.isWithdrawn,
          a.name as academyName,
          a.code as academyCode
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE u.academyId = ?
      `;
      queryParams = [userAcademyId];
      
      // Filter by role if provided (typically STUDENT for bot assignment)
      if (queryRole) {
        query += ' AND u.role = ?';
        queryParams.push(queryRole);
        console.log('👤 DIRECTOR/TEACHER filtering by role:', queryRole);
      }
      
      // Exclude withdrawn students
      query += ' AND (u.isWithdrawn IS NULL OR u.isWithdrawn = 0)';
      
      query += ' ORDER BY u.id DESC LIMIT 1000';
      
      console.log('🏫 DIRECTOR/TEACHER filtering by academyId:', userAcademyId);
    }

    console.log('📝 Executing query to fetch users for role:', role);

    const result = queryParams.length > 0 
      ? await db.prepare(query).bind(...queryParams).all()
      : await db.prepare(query).all();
    const users = result.results || [];

    console.log(`✅ Users fetched: ${users.length} users`);
    
    // Log role breakdown
    const roleStats = {
      students: users.filter(u => u.role?.toUpperCase() === 'STUDENT').length,
      teachers: users.filter(u => u.role?.toUpperCase() === 'TEACHER').length,
      directors: users.filter(u => u.role?.toUpperCase() === 'DIRECTOR').length,
      admins: users.filter(u => ['ADMIN', 'SUPER_ADMIN'].includes(u.role?.toUpperCase())).length
    };
    console.log('📊 Role breakdown:', roleStats);

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
