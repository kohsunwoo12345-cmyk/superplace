// Classes API - Complete CRUD with proper table names

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

    // Get user from database - try both User and users table
    let user = await db
      .prepare('SELECT id, email, role, academyId, academy_id FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();
    
    if (!user) {
      user = await db
        .prepare('SELECT id, email, role, academyId, academy_id FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

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
    const academyId = user.academyId || user.academy_id;
    const userId = user.id;

    console.log('✅ User verified:', { 
      email: user.email, 
      role, 
      academyId, 
      userId,
      rawUser: user 
    });

    let query;
    let params = [];

    // Role-based filtering - 학원별로 완전히 분리
    if (role === 'SUPER_ADMIN') {
      // Super admin can see all classes
      console.log('🔓 Super Admin access - returning all classes');
      query = `
        SELECT 
          c.id,
          CAST(c.academy_id AS INTEGER) as academyId,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id as teacherId,
          c.color,
          c.created_at as createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academies a ON c.academy_id = a.id
        ORDER BY c.created_at DESC
      `;
    } else if (role === 'ADMIN' || role === 'DIRECTOR') {
      // Admins and Directors see only their academy's classes
      if (!academyId) {
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

      console.log('🔒 Admin/Director access - academy filtered:', academyId);
      
      // WHERE 절 없이 모든 클래스를 가져온 후 JavaScript로 필터링
      query = `
        SELECT 
          c.id,
          c.academy_id as academyId,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id as teacherId,
          c.color,
          c.created_at as createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academies a ON c.academy_id = a.id
        ORDER BY c.created_at DESC
      `;
      // params는 비워둠 - JavaScript에서 필터링할 것
    } else if (role === 'TEACHER') {
      // Teachers see only their academy's classes (not just their own)
      if (!academyId) {
        console.error('❌ No academy assigned to teacher');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log('🔒 Teacher access - academy classes:', academyId);
      
      // WHERE 절 없이 모든 클래스를 가져온 후 JavaScript로 필터링
      query = `
        SELECT 
          c.id,
          c.academy_id as academyId,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id as teacherId,
          c.color,
          c.created_at as createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academies a ON c.academy_id = a.id
        ORDER BY c.created_at DESC
      `;
      // params는 비워둠 - JavaScript에서 필터링할 것
    } else if (role === 'STUDENT') {
      // Students see classes they're enrolled in
      console.log('🔒 Student access - enrolled classes only:', userId);
      query = `
        SELECT DISTINCT
          c.id,
          c.academy_id as academyId,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id as teacherId,
          c.color,
          c.created_at as createdAt,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        INNER JOIN class_students cs ON c.id = cs.classId
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN academies a ON c.academy_id = a.id
        WHERE cs.studentId = ?
        ORDER BY c.created_at DESC
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
      
    console.log('🔍 Executing query');
    console.log('📝 SQL Query:', query.substring(0, 200));
    
    const result = await stmt.all();
    let classes = result.results || [];

    console.log(`✅ Query returned ${classes.length} total classes`);
    
    // JavaScript에서 academy 필터링 (ADMIN, DIRECTOR, TEACHER)
    if ((role === 'ADMIN' || role === 'DIRECTOR' || role === 'TEACHER') && academyId) {
      const userAcademyIdStr = String(academyId);
      const userAcademyIdInt = parseInt(userAcademyIdStr.split('.')[0]);
      
      console.log('🔍 Filtering by academyId:', {
        original: academyId,
        string: userAcademyIdStr,
        integer: userAcademyIdInt
      });
      
      const beforeFilter = classes.length;
      classes = classes.filter(cls => {
        // 클래스의 academy_id (DB에서 academyId로 매핑됨)
        const clsAcademyId = cls.academyId || cls.academy_id;
        const clsAcademyIdStr = String(clsAcademyId);
        const clsAcademyIdInt = parseInt(clsAcademyIdStr.split('.')[0]);
        
        // 문자열 비교, 숫자 비교, loose 비교 모두 시도
        const stringMatch = clsAcademyIdStr === userAcademyIdStr;
        const intMatch = !isNaN(clsAcademyIdInt) && !isNaN(userAcademyIdInt) && clsAcademyIdInt === userAcademyIdInt;
        const looseMatch = clsAcademyId == academyId;
        
        const match = stringMatch || intMatch || looseMatch;
        
        if (match) {
          console.log(`✅ MATCH: Class ${cls.id} (${cls.name}) academy_id=${clsAcademyId} (string:${stringMatch}, int:${intMatch}, loose:${looseMatch})`);
        } else {
          console.log(`❌ NO MATCH: Class ${cls.id} academy_id=${clsAcademyId} vs user academyId=${academyId}`);
        }
        
        return match;
      });
      
      console.log(`🔍 Filtered: ${beforeFilter} → ${classes.length} classes`);
    }
    
    console.log(`👤 User info: role=${role}, academyId=${academyId}`);
    
    // Debug: 실제 classes 테이블 데이터 확인
    if (classes.length === 0) {
      console.log('⚠️ No classes found after filtering. Checking all classes in database...');
      const allClasses = await db.prepare('SELECT id, academy_id, class_name FROM classes LIMIT 20').all();
      console.log('📊 All classes in DB:', JSON.stringify(allClasses.results));
    } else {
      console.log('✅ Returning classes:', JSON.stringify(classes.map(c => ({
        id: c.id,
        name: c.name,
        academyId: c.academyId
      }))));
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

// POST: 반 생성
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('➕ Classes API POST called');

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
    let user = await db
      .prepare('SELECT id, email, role, academyId, academy_id FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();
    
    if (!user) {
      user = await db
        .prepare('SELECT id, email, role, academyId, academy_id FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

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
    const academyId = user.academyId || user.academy_id;

    // Only ADMIN, SUPER_ADMIN, DIRECTOR can create classes
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '반을 생성할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request body
    const body = await request.json();
    const { name, grade, description, teacherId, color, schedules, studentIds } = body;

    if (!name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required field: name',
        message: '반 이름을 입력해주세요'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Use user's academyId for the class
    const classAcademyId = academyId;
    const teacherIdValue = teacherId || user.id;
    const classColor = color || '#3B82F6';
    
    // Get Korean time
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const koreanTime = kst.toISOString().slice(0, 19).replace('T', ' ');

    console.log('➕ Creating class:', { 
      classAcademyId, 
      name, 
      grade, 
      teacherIdValue, 
      color: classColor 
    });

    // Insert class
    const result = await db.prepare(`
      INSERT INTO classes (academy_id, class_name, grade, description, teacher_id, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      classAcademyId, 
      name, 
      grade || null, 
      description || null, 
      teacherIdValue, 
      classColor, 
      koreanTime
    ).run();
    
    const classId = result.meta.last_row_id;

    console.log('✅ Class created:', classId);

    // Assign students if provided
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      for (const studentId of studentIds) {
        try {
          const studentIdStr = String(studentId);
          
          // Check if already enrolled
          const existing = await db.prepare(
            'SELECT id FROM class_students WHERE classId = ? AND studentId = ?'
          ).bind(classId, studentIdStr).first();

          if (existing) {
            await db.prepare(
              'UPDATE class_students SET status = ?, enrolledAt = ? WHERE classId = ? AND studentId = ?'
            ).bind('active', koreanTime, classId, studentIdStr).run();
          } else {
            await db.prepare(
              'INSERT INTO class_students (classId, studentId, enrolledAt, status) VALUES (?, ?, ?, ?)'
            ).bind(classId, studentIdStr, koreanTime, 'active').run();
          }
          
          console.log(`✅ Student ${studentIdStr} enrolled in class ${classId}`);
        } catch (err) {
          console.error('❌ Student enrollment error:', err);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      classId: classId,
      message: '반이 생성되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Create class error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create class',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: 반 삭제
export async function onRequestDelete(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('🗑️ Classes API DELETE called');

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

    // Get user
    let user = await db
      .prepare('SELECT id, email, role, academyId, academy_id FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();
    
    if (!user) {
      user = await db
        .prepare('SELECT id, email, role, academyId, academy_id FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

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
    const userAcademyId = user.academyId || user.academy_id;
    const userAcademyIdInt = parseInt(String(userAcademyId).split('.')[0]);

    // Only ADMIN, SUPER_ADMIN, DIRECTOR can delete classes
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '반을 삭제할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get class ID from URL
    const url = new URL(request.url);
    const classId = url.searchParams.get('id');

    if (!classId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing class ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if class exists and belongs to user's academy (except for SUPER_ADMIN)
    const classInfo = await db
      .prepare('SELECT id, academy_id FROM classes WHERE id = ?')
      .bind(classId)
      .first();

    if (!classInfo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Class not found',
        message: '반을 찾을 수 없습니다'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify academy ownership (except for SUPER_ADMIN)
    if (role !== 'SUPER_ADMIN' && parseInt(String(classInfo.academy_id).split('.')[0]) !== userAcademyIdInt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied',
        message: '이 반을 삭제할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete class_students records first
    await db
      .prepare('DELETE FROM class_students WHERE classId = ?')
      .bind(classId)
      .run();

    // Delete class
    await db
      .prepare('DELETE FROM classes WHERE id = ?')
      .bind(classId)
      .run();

    console.log('✅ Class deleted:', classId);

    return new Response(JSON.stringify({
      success: true,
      message: '반이 삭제되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Classes DELETE error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반 삭제 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PATCH: 반 수정
export async function onRequestPatch(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('✏️ Classes API PATCH called');

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

    // Get user
    let user = await db
      .prepare('SELECT id, email, role, academyId, academy_id FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();
    
    if (!user) {
      user = await db
        .prepare('SELECT id, email, role, academyId, academy_id FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

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
    const userAcademyId = user.academyId || user.academy_id;
    const userAcademyIdInt = parseInt(String(userAcademyId).split('.')[0]);

    // Only ADMIN, SUPER_ADMIN, DIRECTOR can edit classes
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '반을 수정할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { id, name, grade, description, color, teacherId } = body;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing class ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if class exists and belongs to user's academy
    const classInfo = await db
      .prepare('SELECT id, academy_id FROM classes WHERE id = ?')
      .bind(id)
      .first();

    if (!classInfo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Class not found',
        message: '반을 찾을 수 없습니다'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify academy ownership (except for SUPER_ADMIN)
    if (role !== 'SUPER_ADMIN' && parseInt(String(classInfo.academy_id).split('.')[0]) !== userAcademyIdInt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied',
        message: '이 반을 수정할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('class_name = ?');
      params.push(name);
    }
    if (grade !== undefined) {
      updates.push('grade = ?');
      params.push(grade);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (teacherId !== undefined) {
      updates.push('teacher_id = ?');
      params.push(teacherId);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    params.push(id);

    const query = `UPDATE classes SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.prepare(query).bind(...params).run();

    console.log('✅ Class updated:', id);

    return new Response(JSON.stringify({
      success: true,
      message: '반이 수정되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Classes PATCH error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반 수정 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
