// Classes API - Using Class, ClassStudent, ClassSchedule tables

// Simple token parser
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  // Token format: id|email|role|academy|timestamp
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

// Helper: Get user from DB
async function getUser(db, email) {
  // Try User table first
  let user = await db
    .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
    .bind(email)
    .first();
  
  if (!user) {
    // Try users table with snake_case
    user = await db
      .prepare('SELECT id, email, role, academy_id as academyId FROM users WHERE email = ?')
      .bind(email)
      .first();
  }
  
  return user;
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

    const user = await getUser(db, tokenData.email);

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

    console.log('✅ User verified:', { 
      email: user.email, 
      role, 
      academyId, 
      userId 
    });

    let classes = [];

    // Role-based filtering
    if (role === 'SUPER_ADMIN') {
      console.log('🔓 Super Admin access - returning all classes');
      const result = await db.prepare(`
        SELECT * FROM Class 
        WHERE isActive = 1
        ORDER BY createdAt DESC
      `).all();
      classes = result.results || [];
    } 
    else if (role === 'ADMIN' || role === 'DIRECTOR' || role === 'TEACHER') {
      if (!academyId) {
        console.error('❌ No academy assigned');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log('🏫 Filtering by academy:', academyId);
      const result = await db.prepare(`
        SELECT * FROM Class 
        WHERE academyId = ? AND isActive = 1
        ORDER BY createdAt DESC
      `).bind(academyId).all();
      classes = result.results || [];
    }
    else if (role === 'STUDENT') {
      console.log('👨‍🎓 Student access - returning enrolled classes');
      const result = await db.prepare(`
        SELECT c.* FROM Class c
        INNER JOIN ClassStudent cs ON c.id = cs.classId
        WHERE cs.studentId = ? AND c.isActive = 1
        ORDER BY c.createdAt DESC
      `).bind(userId).all();
      classes = result.results || [];
    }
    else {
      console.error('❌ Invalid role:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid role'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get student counts and student list for each class
    for (const cls of classes) {
      const countResult = await db.prepare(`
        SELECT COUNT(*) as count FROM ClassStudent WHERE classId = ?
      `).bind(cls.id).first();
      cls.studentCount = countResult?.count || 0;
      
      // Add _count object for frontend compatibility
      cls._count = {
        students: countResult?.count || 0
      };

      // Get student list for edit page
      const studentsResult = await db.prepare(`
        SELECT 
          cs.id as enrollmentId,
          cs.studentId,
          u.id,
          u.name,
          u.email,
          u.phone,
          u.academyId
        FROM ClassStudent cs
        INNER JOIN User u ON cs.studentId = u.id
        WHERE cs.classId = ?
      `).bind(cls.id).all();
      
      cls.students = (studentsResult.results || []).map(s => ({
        id: s.enrollmentId,
        student: {
          id: s.studentId,
          name: s.name,
          email: s.email,
          phone: s.phone,
          academyId: s.academyId
        }
      }));

      // Get schedules
      const schedules = await db.prepare(`
        SELECT * FROM ClassSchedule WHERE classId = ? ORDER BY dayOfWeek, startTime
      `).bind(cls.id).all();
      cls.schedules = schedules.results || [];
    }

    console.log(`✅ Returning ${classes.length} classes`);

    return new Response(JSON.stringify({
      success: true,
      classes: classes,
      count: classes.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error loading classes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반 목록을 불러오는 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: 새 반 생성
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Classes API POST called');

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

    const user = await getUser(db, tokenData.email);

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

    if (role !== 'ADMIN' && role !== 'DIRECTOR' && role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '반을 생성할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse body
    const body = await request.json();
    const { academyId, name, grade, description, teacherId, color, capacity, schedules, studentIds } = body;

    if (!name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Class name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique ID
    const classId = `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Use user's academyId if not provided
    const finalAcademyId = academyId || user.academyId;
    const finalTeacherId = teacherId || user.id;
    const finalColor = color || '#3B82F6';
    const finalCapacity = capacity || 30;

    console.log('Creating class:', {
      classId,
      name,
      grade,
      academyId: finalAcademyId,
      teacherId: finalTeacherId
    });

    // Insert into Class table
    await db.prepare(`
      INSERT INTO Class (id, name, grade, description, academyId, teacherId, color, capacity, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      classId,
      name,
      grade || null,
      description || null,
      finalAcademyId,
      finalTeacherId,
      finalColor,
      finalCapacity,
      now,
      now
    ).run();

    console.log('✅ Class created:', classId);

    // Add students if provided
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      for (const studentId of studentIds) {
        const csId = `cs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db.prepare(`
          INSERT INTO ClassStudent (id, classId, studentId, enrolledAt)
          VALUES (?, ?, ?, ?)
        `).bind(csId, classId, studentId, now).run();
        
        console.log('✅ Student enrolled:', studentId);
      }
    }

    // Add schedules if provided
    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      for (const schedule of schedules) {
        const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db.prepare(`
          INSERT INTO ClassSchedule (id, classId, subject, dayOfWeek, startTime, endTime, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          scheduleId,
          classId,
          schedule.subject || '수업',
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
          now
        ).run();
        
        console.log('✅ Schedule added:', schedule);
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
    console.error('❌ Error creating class:', error);
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

// PATCH: 반 정보 수정
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

    const user = await getUser(db, tokenData.email);

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

    if (role !== 'ADMIN' && role !== 'DIRECTOR' && role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
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
        error: 'Class ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse body
    const body = await request.json();
    const { name, grade, description, color, capacity, teacherId } = body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
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
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(capacity);
    }
    if (teacherId !== undefined) {
      updates.push('teacherId = ?');
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

    // Add updatedAt
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    updates.push('updatedAt = ?');
    params.push(now);

    // Add classId
    params.push(classId);

    const query = `UPDATE Class SET ${updates.join(', ')} WHERE id = ?`;
    
    console.log('Updating class:', { classId, updates, query });

    await db.prepare(query).bind(...params).run();

    console.log('✅ Class updated:', classId);

    return new Response(JSON.stringify({
      success: true,
      message: '반이 수정되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error updating class:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반을 수정하는 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: 반 삭제 (soft delete)
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

    const user = await getUser(db, tokenData.email);

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

    if (role !== 'ADMIN' && role !== 'DIRECTOR' && role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
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
        error: 'Class ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Deleting class:', classId);

    // Soft delete: set isActive to 0
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    await db.prepare(`
      UPDATE Class SET isActive = 0, updatedAt = ? WHERE id = ?
    `).bind(now, classId).run();

    console.log('✅ Class deleted (soft):', classId);

    return new Response(JSON.stringify({
      success: true,
      message: '반이 삭제되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error deleting class:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반을 삭제하는 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
