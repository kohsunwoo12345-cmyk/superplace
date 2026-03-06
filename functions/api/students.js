// Students API - JavaScript version for Cloudflare Pages

// Simple token parser
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  // Token format: id|email|role|timestamp
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

    console.log('📋 Students API called');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token from Authorization header
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

    console.log('✅ Token parsed:', { email: tokenData.email, role: tokenData.role });

    // Get user from database to verify and get academyId
    const user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      console.error('❌ User not found:', tokenData.email);
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
        message: '사용자 정보를 찾을 수 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    const academyId = user.academyId;

    console.log('✅ User verified:', { email: user.email, role, academyId });

    let query;
    let params = [];

    // Role-based filtering
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // Admins can see all students
      console.log('🔓 Admin access - returning all students');
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          u.status,
          u.school,
          u.grade,
          u.class,
          a.name as academy_name
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE UPPER(u.role) = 'STUDENT'
          AND (u.status IS NULL OR u.status = 'ACTIVE')
        ORDER BY u.id DESC
      `;
    } else if (role === 'DIRECTOR' || role === 'TEACHER') {
      // Directors and teachers can only see students in their academy
      if (!academyId) {
        console.error('❌ No academy assigned to director/teacher');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('🔒 Academy-filtered access:', { role, academyId });
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          u.status,
          u.school,
          u.grade,
          u.class,
          a.name as academy_name
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE UPPER(u.role) = 'STUDENT' AND u.academyId = ?
          AND (u.status IS NULL OR u.status = 'ACTIVE')
        ORDER BY u.id DESC
      `;
      params.push(academyId);
    } else if (role === 'STUDENT') {
      // Students can only see themselves
      console.log('🔒 Student access - returning only self');
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          a.name as academy_name
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE u.id = ?
      `;
      params.push(user.id);
    } else {
      console.error('❌ Invalid role:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid role',
        message: '권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute query
    const stmt = params.length > 0 
      ? db.prepare(query).bind(...params)
      : db.prepare(query);
      
    console.log('🔍 Executing query with params:', params);
    const result = await stmt.all();
    const students = result.results || [];

    console.log(`✅ Returning ${students.length} students for ${role}`);
    
    // Log first few students for debugging
    if (students.length > 0) {
      console.log('📊 Sample students:', students.slice(0, 3).map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        academyId: s.academyId
      })));
    } else {
      console.log('⚠️ No students found - running diagnostics...');
      
      // Check 1: Total users with STUDENT role (case insensitive)
      const totalCheck = await db.prepare(`
        SELECT COUNT(*) as count, 
               GROUP_CONCAT(DISTINCT role) as roles
        FROM User 
        WHERE UPPER(role) = 'STUDENT'
      `).first();
      console.log('📊 Total STUDENT users in DB:', totalCheck);
      
      // Check 2: All distinct roles in User table
      const allRoles = await db.prepare(`
        SELECT DISTINCT role, COUNT(*) as count
        FROM User
        GROUP BY role
      `).all();
      console.log('📊 All roles in DB:', allRoles.results);
      
      // Check 3: Sample of all users (first 5)
      const sampleUsers = await db.prepare(`
        SELECT id, name, role, academyId
        FROM User
        ORDER BY createdAt DESC
        LIMIT 5
      `).all();
      console.log('📊 Sample of all users:', sampleUsers.results);
      
      // Check 4: If admin, show why students weren't returned
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        const testQuery = await db.prepare(`
          SELECT COUNT(*) as count
          FROM User u
          WHERE u.role = 'STUDENT'
        `).first();
        console.log('📊 Students with exact match "STUDENT":', testQuery);
        
        const testQueryLower = await db.prepare(`
          SELECT COUNT(*) as count
          FROM User u
          WHERE u.role = 'student'
        `).first();
        console.log('📊 Students with lowercase "student":', testQueryLower);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      students: students,
      count: students.length,
      userRole: role,
      userAcademy: academyId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Students API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '학생 목록을 불러오는 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
