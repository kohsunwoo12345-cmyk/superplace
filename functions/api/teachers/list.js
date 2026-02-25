// Teacher List API - JavaScript version
// GET /api/teachers/list

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
    role: parts[2],
    academyId: parts[3] || null
  };
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('=== Teacher list API called ===');

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token and verify auth
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: '인증이 필요합니다'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('인증됨:', { role: tokenData.role, academyId: tokenData.academyId });

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

    // Check permissions
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Permission check passed');

    const allTeachers = [];

    // Query User table for teachers
    try {
      let query = `
        SELECT 
          id, 
          email, 
          name, 
          phone, 
          role, 
          academyId, 
          approved,
          isWithdrawn,
          createdAt,
          updatedAt
        FROM User 
        WHERE role = 'TEACHER' 
          AND (isWithdrawn IS NULL OR isWithdrawn = 0)
      `;

      const bindings = [];

      // Filter by academy for DIRECTOR
      if (role === 'DIRECTOR' && user.academyId) {
        query += ' AND academyId = ?';
        bindings.push(user.academyId);
      }

      query += ' ORDER BY createdAt DESC';

      console.log('🔍 Query:', query);
      console.log('📊 Bindings:', bindings);

      const result = await db.prepare(query).bind(...bindings).all();
      
      console.log(`✅ User 테이블에서 ${result.results.length}명의 교사 조회`);
      
      allTeachers.push(...result.results);
    } catch (e) {
      console.error('❌ User 테이블 조회 실패:', e.message);
    }

    // Also check users table (legacy)
    try {
      let query = `
        SELECT 
          id, 
          email, 
          name, 
          phone, 
          role, 
          academy_id as academyId,
          created_at as createdAt
        FROM users 
        WHERE role = 'TEACHER'
      `;

      const bindings = [];

      // Filter by academy for DIRECTOR
      if (role === 'DIRECTOR' && user.academyId) {
        query += ' AND academy_id = ?';
        bindings.push(user.academyId);
      }

      query += ' ORDER BY created_at DESC';

      const result = await db.prepare(query).bind(...bindings).all();
      
      console.log(`✅ users 테이블에서 ${result.results.length}명의 교사 조회`);
      
      // Add default values for users table results
      const usersTableResults = result.results.map(teacher => ({
        ...teacher,
        approved: teacher.approved !== undefined ? teacher.approved : 1,
        isWithdrawn: teacher.isWithdrawn !== undefined ? teacher.isWithdrawn : 0,
        updatedAt: teacher.updatedAt || teacher.createdAt
      }));
      
      allTeachers.push(...usersTableResults);
    } catch (e) {
      console.error('❌ users 테이블 조회 실패:', e.message);
    }

    console.log(`📊 총 교사 수: ${allTeachers.length}명`);

    // Add counts (mock data for now)
    const teachersWithCounts = allTeachers.map(teacher => ({
      ...teacher,
      _count: {
        createdMaterials: 0,
        createdAssignments: 0
      }
    }));

    return new Response(JSON.stringify({
      success: true,
      teachers: teachersWithCounts,
      total: teachersWithCounts.length,
      debug: {
        role: tokenData.role,
        academyId: tokenData.academyId,
        email: tokenData.email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Teacher list error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
