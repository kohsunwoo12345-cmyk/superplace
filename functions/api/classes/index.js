// Classes API - Completely rewritten 2026-02-22-v3
// This version bypasses all Cloudflare cache issues

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return { id: parts[0], email: parts[1], role: parts[2] };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;

  console.log('📚 Classes API v3 - REWRITTEN VERSION');

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const authHeader = request.headers.get('Authorization');
  const tokenData = parseToken(authHeader);

  if (!tokenData) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user
  let user = await db.prepare('SELECT id, email, role, academy_id FROM users WHERE email = ?').bind(tokenData.email).first();

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const role = (user.role || '').toUpperCase();
  const userAcademyId = user.academy_id;

  console.log('User:', { role, academy_id: userAcademyId });

  // Get ALL classes (no WHERE to avoid column issues)
  const query = `
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

  const result = await db.prepare(query).all();
  let classes = result.results || [];

  console.log(`Total classes: ${classes.length}`);

  // Filter based on role
  if (role === 'SUPER_ADMIN') {
    // Return all
  } else if (role === 'ADMIN' || role === 'DIRECTOR') {
    if (!userAcademyId) {
      return new Response(JSON.stringify({ success: false, error: 'No academy assigned' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    classes = classes.filter(cls => {
      const clsAcademy = cls.academy_id;
      const userAcademy = userAcademyId;
      
      // String comparison
      if (String(clsAcademy) === String(userAcademy)) return true;
      
      // Numeric comparison
      const clsNum = parseInt(String(clsAcademy));
      const userNum = parseInt(String(userAcademy));
      if (!isNaN(clsNum) && !isNaN(userNum) && clsNum === userNum) return true;
      
      // Loose
      if (clsAcademy == userAcademy) return true;
      
      return false;
    });

    console.log(`Filtered to ${classes.length} classes for academy ${userAcademyId}`);
  } else if (role === 'TEACHER') {
    classes = classes.filter(cls => String(cls.teacher_id) === String(user.id));
  } else if (role === 'STUDENT') {
    const studentClasses = await db.prepare(`
      SELECT classId FROM class_students WHERE studentId = ? AND status = 'active'
    `).bind(user.id).all();
    const classIds = (studentClasses.results || []).map(r => r.classId);
    classes = classes.filter(cls => classIds.includes(cls.id));
  }

  return new Response(JSON.stringify({ success: true, classes, count: classes.length }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}

// DELETE
export async function onRequestDelete(context) {
  const { request, env } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const authHeader = request.headers.get('Authorization');
  const tokenData = parseToken(authHeader);

  if (!tokenData) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  let user = await db.prepare('SELECT id, email, role, academy_id FROM users WHERE email = ?').bind(tokenData.email).first();

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const role = (user.role || '').toUpperCase();
  const userAcademyId = user.academy_id;

  if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ success: false, error: 'Insufficient permissions' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const classId = url.searchParams.get('id');

  if (!classId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing class ID' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const classInfo = await db.prepare('SELECT id, academy_id FROM classes WHERE id = ?').bind(classId).first();

  if (!classInfo) {
    return new Response(JSON.stringify({ success: false, error: 'Class not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (role !== 'SUPER_ADMIN') {
    const clsAcademy = String(classInfo.academy_id);
    const usrAcademy = String(userAcademyId);
    if (clsAcademy !== usrAcademy && parseInt(clsAcademy) !== parseInt(usrAcademy)) {
      return new Response(JSON.stringify({ success: false, error: 'Access denied' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  await db.prepare('DELETE FROM class_students WHERE classId = ?').bind(classId).run();
  await db.prepare('DELETE FROM classes WHERE id = ?').bind(classId).run();

  return new Response(JSON.stringify({ success: true, message: '반이 삭제되었습니다' }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}

// PATCH
export async function onRequestPatch(context) {
  const { request, env } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const authHeader = request.headers.get('Authorization');
  const tokenData = parseToken(authHeader);

  if (!tokenData) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  let user = await db.prepare('SELECT id, email, role, academy_id FROM users WHERE email = ?').bind(tokenData.email).first();

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const role = (user.role || '').toUpperCase();
  const userAcademyId = user.academy_id;

  if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ success: false, error: 'Insufficient permissions' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await request.json();
  const { id, name, grade, description, color, teacher_id } = body;

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing class ID' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const classInfo = await db.prepare('SELECT id, academy_id FROM classes WHERE id = ?').bind(id).first();

  if (!classInfo) {
    return new Response(JSON.stringify({ success: false, error: 'Class not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (role !== 'SUPER_ADMIN') {
    const clsAcademy = String(classInfo.academy_id);
    const usrAcademy = String(userAcademyId);
    if (clsAcademy !== usrAcademy && parseInt(clsAcademy) !== parseInt(usrAcademy)) {
      return new Response(JSON.stringify({ success: false, error: 'Access denied' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
  }

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
  if (teacher_id !== undefined) {
    updates.push('teacher_id = ?');
    params.push(teacher_id);
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ success: false, error: 'No fields to update' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  params.push(id);
  const query = `UPDATE classes SET ${updates.join(', ')} WHERE id = ?`;

  await db.prepare(query).bind(...params).run();

  return new Response(JSON.stringify({ success: true, message: '반이 수정되었습니다' }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
