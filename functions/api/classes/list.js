// 클래스 목록 조회 API (캐시 우회용 새 엔드포인트)
// /api/classes/list

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

    console.log('📚 Classes LIST API called - NEW ENDPOINT');

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
        error: 'Unauthorized',
        message: '인증이 필요합니다'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('👤 User from token:', tokenData.email);

    // Get user from database
    let user = await db
      .prepare('SELECT id, email, role, academy_id FROM users WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      console.error('❌ User not found:', tokenData.email);
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
        message: '사용자를 찾을 수 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    const academy_id = user.academy_id;

    console.log('👤 User info:', { role, academy_id });

    let query = '';
    let params = [];

    if (role === 'SUPER_ADMIN') {
      // Super Admin sees all classes
      console.log('🔓 Super Admin access - returning all classes');
      query = `
        SELECT 
          c.id,
          c.academy_id,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id,
          c.color,
          c.created_at,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academy a ON c.academy_id = a.id
        ORDER BY c.created_at DESC
      `;
    } else if (role === 'ADMIN' || role === 'DIRECTOR') {
      if (!academy_id) {
        console.error('❌ No academy assigned');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('🔒 Admin/Director access - academy filtered:', academy_id);
      
      query = `
        SELECT 
          c.id,
          c.academy_id,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id,
          c.color,
          c.created_at,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academy a ON c.academy_id = a.id
        ORDER BY c.created_at DESC
      `;
    } else if (role === 'TEACHER') {
      if (!academy_id) {
        console.error('❌ No academy assigned');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('👨‍🏫 Teacher access - assigned classes only');
      query = `
        SELECT 
          c.id,
          c.academy_id,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id,
          c.color,
          c.created_at,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academy a ON c.academy_id = a.id
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
      `;
      params.push(user.id);
    } else if (role === 'STUDENT') {
      console.log('👨‍🎓 Student access - enrolled classes only');
      query = `
        SELECT 
          c.id,
          c.academy_id,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id,
          c.color,
          c.created_at,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        INNER JOIN class_students cs ON c.id = cs.classId
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academy a ON c.academy_id = a.id
        WHERE cs.studentId = ? AND cs.status = 'active'
        ORDER BY c.created_at DESC
      `;
      params.push(user.id);
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unknown role'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stmt = params.length > 0 
      ? db.prepare(query).bind(...params)
      : db.prepare(query);
      
    console.log('🔍 Executing query');
    
    const result = await stmt.all();
    let classes = result.results || [];

    console.log(`✅ Query returned ${classes.length} total classes`);
    
    // JavaScript에서 academy 필터링 (ADMIN, DIRECTOR, TEACHER)
    if ((role === 'ADMIN' || role === 'DIRECTOR' || role === 'TEACHER') && academy_id) {
      const userAcademyIdStr = String(academy_id);
      const userAcademyIdInt = parseInt(userAcademyIdStr.split('.')[0]);
      
      console.log('🔍 Filtering by academy_id:', {
        original: academy_id,
        string: userAcademyIdStr,
        integer: userAcademyIdInt
      });
      
      const beforeFilter = classes.length;
      classes = classes.filter(cls => {
        const clsAcademyIdStr = String(cls.academy_id);
        const clsAcademyIdInt = parseInt(clsAcademyIdStr.split('.')[0]);
        
        const match = 
          clsAcademyIdStr === userAcademyIdStr ||
          clsAcademyIdInt === userAcademyIdInt ||
          cls.academy_id == academy_id;
        
        if (match) {
          console.log(`✅ MATCH: Class ${cls.id} (${cls.name}) academy_id=${cls.academy_id}`);
        }
        
        return match;
      });
      
      console.log(`🔍 Filtered: ${beforeFilter} → ${classes.length} classes`);
    }

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
