// Classes API - Database-based storage
// Supports full CRUD operations with persistent storage

// Helper function to parse token and get user info
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length >= 4) {
    return {
      userId: parts[0],
      email: parts[1],
      role: parts[2],
      academyId: parts[3],
    };
  }
  
  return null;
}

// Helper function to create JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// GET - Fetch all classes for academy
export async function onRequestGet(context) {
  const { DB } = context.env;
  
  if (!DB) {
    return jsonResponse({ success: false, error: 'Database not configured' }, 500);
  }

  console.log('📚 [DB CLASSES API] GET - Fetching classes');

  try {
    // Get user from token
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);
    const academyId = user?.academyId || '1';
    
    console.log(`👤 [DB CLASSES API] User: ${user?.email || 'demo'}, Academy: ${academyId}`);

    // Fetch classes from database
    const classesResult = await DB.prepare(`
      SELECT * FROM Class 
      WHERE academyId = ? AND isActive = 1
      ORDER BY createdAt DESC
    `).bind(academyId).all();

    const classes = classesResult.results || [];
    console.log(`📊 [DB CLASSES API] Total classes: ${classes.length}`);

    // Fetch schedules and students for each class
    const classesWithDetails = await Promise.all(
      classes.map(async (cls) => {
        // Get schedules
        const schedulesResult = await DB.prepare(`
          SELECT id, subject, dayOfWeek, startTime, endTime
          FROM ClassSchedule
          WHERE classId = ?
        `).bind(cls.id).all();

        // Get students
        const studentsResult = await DB.prepare(`
          SELECT cs.id, cs.studentId, u.name, u.email, u.studentId as studentCode, u.grade
          FROM ClassStudent cs
          JOIN User u ON cs.studentId = u.id
          WHERE cs.classId = ?
        `).bind(cls.id).all();

        const students = (studentsResult.results || []).map(s => ({
          id: s.id,
          student: {
            id: s.studentId,
            name: s.name,
            email: s.email,
            studentCode: s.studentCode || '',
            grade: s.grade,
          }
        }));

        return {
          ...cls,
          isActive: cls.isActive === 1,
          schedules: schedulesResult.results || [],
          students: students,
          _count: { students: students.length },
        };
      })
    );

    return jsonResponse({
      success: true,
      classes: classesWithDetails,
      total: classesWithDetails.length,
      message: `Classes loaded successfully for academy ${academyId}`,
    });

  } catch (error) {
    console.error('❌ [DB CLASSES API] GET error:', error);
    return jsonResponse(
      {
        success: false,
        message: error.message || 'Failed to fetch classes',
      },
      500
    );
  }
}

// POST - Create new class
export async function onRequestPost(context) {
  const { DB } = context.env;
  
  if (!DB) {
    return jsonResponse({ success: false, error: 'Database not configured' }, 500);
  }

  try {
    const body = await context.request.json();
    
    // Get user from token
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);
    const academyId = user?.academyId || '1';
    
    console.log(`➕ [DB CLASSES API] POST - Creating new class for academy ${academyId}:`, body.name);

    const classId = `class-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Insert class
    await DB.prepare(`
      INSERT INTO Class (id, name, grade, description, color, capacity, isActive, academyId, teacherId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      classId,
      body.name,
      body.grade || null,
      body.description || null,
      body.color || null,
      body.capacity || 20,
      body.isActive !== false ? 1 : 0,
      academyId,
      body.teacherId || null
    ).run();

    // Insert schedules if provided
    if (body.schedules && body.schedules.length > 0) {
      for (const schedule of body.schedules) {
        const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await DB.prepare(`
          INSERT INTO ClassSchedule (id, classId, subject, dayOfWeek, startTime, endTime)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          scheduleId,
          classId,
          schedule.subject,
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime
        ).run();
      }
    }

    // Insert students if provided
    if (body.students && body.students.length > 0) {
      console.log(`📝 [DB CLASSES API] Adding ${body.students.length} students to class ${classId}`);
      for (const studentId of body.students) {
        const csId = `cs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`  - Adding student: ${studentId}`);
        await DB.prepare(`
          INSERT INTO ClassStudent (id, classId, studentId, enrolledAt)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(csId, classId, studentId).run();
      }
      console.log(`✅ [DB CLASSES API] Successfully added all students`);
    }

    // Fetch the created class with details
    const classResult = await DB.prepare(`
      SELECT * FROM Class WHERE id = ?
    `).bind(classId).first();

    const schedulesResult = await DB.prepare(`
      SELECT * FROM ClassSchedule WHERE classId = ?
    `).bind(classId).all();

    // Fetch students with details
    const studentsResult = await DB.prepare(`
      SELECT cs.id, cs.studentId, u.name, u.email, u.studentId as studentCode, u.grade
      FROM ClassStudent cs
      JOIN User u ON cs.studentId = u.id
      WHERE cs.classId = ?
    `).bind(classId).all();

    const students = (studentsResult.results || []).map(s => ({
      id: s.id,
      student: {
        id: s.studentId,
        name: s.name,
        email: s.email,
        studentCode: s.studentCode || '',
        grade: s.grade,
      }
    }));

    console.log(`✅ [DB CLASSES API] Class created: ${classId} with ${students.length} students`);

    return jsonResponse(
      {
        success: true,
        class: {
          ...classResult,
          isActive: classResult.isActive === 1,
          schedules: schedulesResult.results || [],
          students: students,
          _count: { students: students.length },
        },
        message: '클래스가 생성되었습니다',
      },
      201
    );
  } catch (error) {
    console.error('❌ [DB CLASSES API] POST error:', error);
    return jsonResponse(
      {
        success: false,
        message: error.message || '클래스 생성 실패',
      },
      500
    );
  }
}

// PUT - Update class
export async function onRequestPut(context) {
  const { DB } = context.env;
  
  if (!DB) {
    return jsonResponse({ success: false, error: 'Database not configured' }, 500);
  }

  try {
    const body = await context.request.json();
    const { id, schedules, students, ...updates } = body;

    // Get user from token
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);
    const academyId = user?.academyId || '1';

    console.log(`✏️ [DB CLASSES API] PUT - Updating class ${id} for academy ${academyId}`);

    // Check if class exists and belongs to this academy
    const existingClass = await DB.prepare(`
      SELECT * FROM Class WHERE id = ? AND academyId = ?
    `).bind(id, academyId).first();

    if (!existingClass) {
      return jsonResponse({ success: false, message: '클래스를 찾을 수 없습니다' }, 404);
    }

    // Update class
    await DB.prepare(`
      UPDATE Class 
      SET name = ?, grade = ?, description = ?, color = ?, 
          capacity = ?, isActive = ?, teacherId = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      updates.name || existingClass.name,
      updates.grade !== undefined ? updates.grade : existingClass.grade,
      updates.description !== undefined ? updates.description : existingClass.description,
      updates.color !== undefined ? updates.color : existingClass.color,
      updates.capacity !== undefined ? updates.capacity : existingClass.capacity,
      updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : existingClass.isActive,
      updates.teacherId !== undefined ? updates.teacherId : existingClass.teacherId,
      id
    ).run();

    // Update schedules if provided
    if (schedules) {
      // Delete existing schedules
      await DB.prepare(`DELETE FROM ClassSchedule WHERE classId = ?`).bind(id).run();
      
      // Insert new schedules
      for (const schedule of schedules) {
        const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await DB.prepare(`
          INSERT INTO ClassSchedule (id, classId, subject, dayOfWeek, startTime, endTime)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          scheduleId,
          id,
          schedule.subject,
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime
        ).run();
      }
    }

    // Update students if provided
    if (students !== undefined) {
      console.log(`📝 [DB CLASSES API] Updating students for class ${id}`);
      
      // Delete existing student associations
      await DB.prepare(`DELETE FROM ClassStudent WHERE classId = ?`).bind(id).run();
      console.log(`  - Removed existing student associations`);
      
      // Insert new student associations
      if (students && students.length > 0) {
        console.log(`  - Adding ${students.length} students`);
        for (const studentId of students) {
          const csId = `cs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          console.log(`    * Adding student: ${studentId}`);
          await DB.prepare(`
            INSERT INTO ClassStudent (id, classId, studentId, enrolledAt)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(csId, id, studentId).run();
        }
        console.log(`✅ [DB CLASSES API] Successfully added all students`);
      } else {
        console.log(`  - No students to add`);
      }
    }

    console.log(`✅ [DB CLASSES API] Class updated: ${id}`);

    // Fetch updated class with students
    const updatedClass = await DB.prepare(`SELECT * FROM Class WHERE id = ?`).bind(id).first();
    const schedulesResult = await DB.prepare(`SELECT * FROM ClassSchedule WHERE classId = ?`).bind(id).all();
    
    // Fetch students with details
    const studentsResult = await DB.prepare(`
      SELECT cs.id, cs.studentId, u.name, u.email, u.studentId as studentCode, u.grade
      FROM ClassStudent cs
      JOIN User u ON cs.studentId = u.id
      WHERE cs.classId = ?
    `).bind(id).all();

    const studentsWithDetails = (studentsResult.results || []).map(s => ({
      id: s.id,
      student: {
        id: s.studentId,
        name: s.name,
        email: s.email,
        studentCode: s.studentCode || '',
        grade: s.grade,
      }
    }));

    return jsonResponse({
      success: true,
      class: {
        ...updatedClass,
        isActive: updatedClass.isActive === 1,
        schedules: schedulesResult.results || [],
        students: studentsWithDetails,
        _count: { students: studentsWithDetails.length },
      },
      message: '클래스가 수정되었습니다',
    });
  } catch (error) {
    console.error('❌ [DB CLASSES API] PUT error:', error);
    return jsonResponse({ success: false, message: error.message || '클래스 수정 실패' }, 500);
  }
}

// DELETE - Delete class
export async function onRequestDelete(context) {
  const { DB } = context.env;
  
  if (!DB) {
    return jsonResponse({ success: false, error: 'Database not configured' }, 500);
  }

  try {
    const url = new URL(context.request.url);
    const classId = url.searchParams.get('id');

    // Get user from token
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);
    const academyId = user?.academyId || '1';

    console.log(`🗑️ [DB CLASSES API] DELETE - Deleting class: ${classId} from academy ${academyId}`);

    if (!classId) {
      return jsonResponse({ success: false, message: '클래스 ID가 필요합니다' }, 400);
    }

    // Check if class exists and belongs to this academy
    const existingClass = await DB.prepare(`
      SELECT * FROM Class WHERE id = ? AND academyId = ?
    `).bind(classId, academyId).first();

    if (!existingClass) {
      return jsonResponse({ success: false, message: '클래스를 찾을 수 없습니다' }, 404);
    }

    // Delete class (CASCADE will delete schedules and student relationships)
    await DB.prepare(`DELETE FROM Class WHERE id = ?`).bind(classId).run();

    console.log(`✅ [DB CLASSES API] Class deleted: ${classId}`);

    return jsonResponse({
      success: true,
      message: '클래스가 삭제되었습니다',
    });
  } catch (error) {
    console.error('❌ [DB CLASSES API] DELETE error:', error);
    return jsonResponse({ success: false, message: error.message || '클래스 삭제 실패' }, 500);
  }
}
