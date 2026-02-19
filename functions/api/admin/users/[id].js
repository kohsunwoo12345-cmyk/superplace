// Admin User Detail API - JavaScript version

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
    const { request, env, params } = context;
    const db = env.DB;
    const userId = params.id;

    console.log('👤 User detail API called for userId:', userId);

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

    // Get requesting user
    const requestingUser = await db
      .prepare('SELECT id, email, role FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!requestingUser) {
      console.error('❌ User not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = requestingUser.role ? requestingUser.role.toUpperCase() : '';

    // Only SUPER_ADMIN and ADMIN can access user details
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user detail with academy info
    const user = await db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.password,
        u.academyId,
        u.grade,
        u.approved,
        u.createdAt,
        u.updatedAt,
        a.name as academyName,
        a.code as academyCode
      FROM User u
      LEFT JOIN Academy a ON u.academyId = a.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      console.error('❌ User not found:', userId);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User detail found:', { id: user.id, email: user.email, role: user.role });

    // Return user detail
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        password: user.password, // Include for admin viewing
        academyId: user.academyId,
        academyName: user.academyName,
        academyCode: user.academyCode,
        grade: user.grade,
        approved: user.approved,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Default values for optional fields
        points: 0,
        balance: 0,
        lastLoginAt: null,
        lastLoginIp: null
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ User detail error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '사용자 정보를 불러오는 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
