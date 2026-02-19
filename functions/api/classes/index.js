// Classes API - JavaScript version with role-based filtering

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

// GET: 반 목록 조회
export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📚 Classes API GET called');

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
        error: 'Unauthorized',
        message: '인증이 필요합니다'
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
      console.error('❌ User not found:', tokenData.email);
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    const academyId = user.academyId;
    const userId = user.id;

    console.log('✅ User verified:', { email: user.email, role, academyId, userId });

    let query;
    let params = [];

    // Role-based filtering
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // Admins can see all classes
      console.log('🔓 Admin access - returning all classes');
      query = `
        SELECT 
          c.id,
          c.academyId,
          c.name,
          c.grade,
          c.description,
          c.teacherId,
          c.color,
          c.createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM Class c
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN Academy a ON c.academyId = a.id
        ORDER BY c.createdAt DESC
      `;
    } else if (role === 'DIRECTOR') {
      // Directors see all classes in their academy
      if (!academyId) {
        console.error('❌ No academy assigned to director');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('🔒 Director access - academy filtered:', academyId);
      query = `
        SELECT 
          c.id,
          c.academyId,
          c.name,
          c.grade,
          c.description,
          c.teacherId,
          c.color,
          c.createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM Class c
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN Academy a ON c.academyId = a.id
        WHERE c.academyId = ?
        ORDER BY c.createdAt DESC
      `;
      params.push(academyId);
    } else if (role === 'TEACHER') {
      // Teachers see only their own classes
      console.log('🔒 Teacher access - own classes only:', userId);
      query = `
        SELECT 
          c.id,
          c.academyId,
          c.name,
          c.grade,
          c.description,
          c.teacherId,
          c.color,
          c.createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM Class c
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN Academy a ON c.academyId = a.id
        WHERE c.teacherId = ?
        ORDER BY c.createdAt DESC
      `;
      params.push(userId);
    } else if (role === 'STUDENT') {
      // Students see classes they're enrolled in
      console.log('🔒 Student access - enrolled classes only:', userId);
      query = `
        SELECT DISTINCT
          c.id,
          c.academyId,
          c.name,
          c.grade,
          c.description,
          c.teacherId,
          c.color,
          c.createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM Class c
        INNER JOIN ClassStudent cs ON c.id = cs.classId
        LEFT JOIN User u ON c.teacherId = u.id
        LEFT JOIN Academy a ON c.academyId = a.id
        WHERE cs.studentId = ?
        ORDER BY c.createdAt DESC
      `;
      params.push(userId);
    } else {
      console.error('❌ Invalid role:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid role'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stmt = params.length > 0 
      ? db.prepare(query).bind(...params)
      : db.prepare(query);
      
    const result = await stmt.all();
    const classes = result.results || [];

    console.log(`✅ Returning ${classes.length} classes for ${role}`);

    return new Response(JSON.stringify({
      success: true,
      classes: classes,
      count: classes.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Classes GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반 목록을 불러오는 중 오류가 발생했습니다',
      classes: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: 반 생성
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📚 Classes API POST called');

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

    // Only DIRECTOR and ADMIN can create classes
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '반을 생성할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, grade, description, teacherId, color } = body;

    if (!name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields',
        message: '반 이름은 필수입니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For directors, use their academyId
    const academyId = role === 'DIRECTOR' ? userAcademyId : (body.academyId || userAcademyId);

    if (!academyId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No academy assigned'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const classId = `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(`
        INSERT INTO Class (id, academyId, name, grade, description, teacherId, color, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(classId, academyId, name, grade || '', description || '', teacherId || null, color || '#8B5CF6')
      .run();

    console.log('✅ Class created:', { classId, name, academyId });

    return new Response(JSON.stringify({
      success: true,
      message: '반이 생성되었습니다',
      classId: classId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Classes POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반 생성 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
