// Classes API v2 - Handles mixed data types (strings and numbers)
// Created: 2026-02-22 to bypass Cloudflare cache issues

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

// Helper: Compare academy IDs (handles strings and numbers)
function compareAcademyIds(id1, id2) {
  if (id1 === null || id2 === null || id1 === undefined || id2 === undefined) {
    return false;
  }
  
  const str1 = String(id1);
  const str2 = String(id2);
  
  // Direct string comparison
  if (str1 === str2) {
    return true;
  }
  
  // Try numeric comparison
  const num1 = parseInt(str1.split('.')[0]);
  const num2 = parseInt(str2.split('.')[0]);
  
  if (!isNaN(num1) && !isNaN(num2) && num1 === num2) {
    return true;
  }
  
  // Loose equality
  if (id1 == id2) {
    return true;
  }
  
  return false;
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📚 Classes API v2 GET called');

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

    // Get user from database - try both tables
    let user = await db
      .prepare('SELECT id, email, role, academy_id FROM users WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      // Try User table (capitalized)
      user = await db
        .prepare('SELECT id, email, role, academyId as academy_id FROM User WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

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

    console.log('👤 User info:', { role, academy_id, type: typeof academy_id });

    // Get ALL classes first (no WHERE clause to avoid column name issues)
    let query = `
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
      LEFT JOIN academy a ON CAST(c.academy_id AS TEXT) = CAST(a.id AS TEXT)
      ORDER BY c.created_at DESC
    `;

    console.log('🔍 Executing query to get all classes');
    
    const result = await db.prepare(query).all();
    let classes = result.results || [];

    console.log(`✅ Query returned ${classes.length} total classes`);

    // Filter in JavaScript based on role
    if (role === 'SUPER_ADMIN') {
      console.log('🔓 Super Admin - keeping all classes');
      // No filtering needed
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

      console.log('🔒 Admin/Director - filtering by academy_id:', academy_id);
      
      const beforeFilter = classes.length;
      classes = classes.filter(cls => {
        const match = compareAcademyIds(cls.academy_id, academy_id);
        
        if (match) {
          console.log(`✅ MATCH: Class ${cls.id} (${cls.name}) academy_id=${cls.academy_id}`);
        } else {
          console.log(`❌ NO MATCH: Class ${cls.id} academy_id=${cls.academy_id} vs user=${academy_id}`);
        }
        
        return match;
      });
      
      console.log(`🔍 Filtered: ${beforeFilter} → ${classes.length} classes`);
    } else if (role === 'TEACHER') {
      console.log('👨‍🏫 Teacher - filtering by teacher_id');
      classes = classes.filter(cls => {
        return String(cls.teacher_id) === String(user.id) || cls.teacher_id == user.id;
      });
    } else if (role === 'STUDENT') {
      // For students, need to check class_students table
      console.log('👨‍🎓 Student - getting enrolled classes');
      const studentClassesResult = await db.prepare(`
        SELECT classId FROM class_students 
        WHERE studentId = ? AND status = 'active'
      `).bind(user.id).all();
      
      const enrolledClassIds = (studentClassesResult.results || []).map(r => r.classId);
      
      classes = classes.filter(cls => enrolledClassIds.includes(cls.id));
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
    console.error('❌ Classes v2 GET error:', error);
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
