// 클래스 생성 API - Class 테이블 사용 (파스칼 케이스)
// isActive를 명시적으로 1로 설정하여 목록에 표시되도록 함

interface Env {
  DB: D1Database;
}

function getKoreanTime(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kst.toISOString().slice(0, 19).replace('T', ' ');
}

// Simple token parser
function parseToken(authHeader: string | null) {
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Database not configured" 
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    console.log('📝 Create class API called');

    // Parse token
    const authHeader = context.request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ No token provided');
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
    const user = await DB.prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
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

    const body = await context.request.json();
    const { name, grade, description, color, capacity, schedules, students, studentIds } = body;

    if (!name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required field: name" 
      }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const academyIdValue = user.academyId || null;
    const teacherIdValue = user.id;
    const classColor = color || '#3B82F6';
    const classCapacity = capacity || 30;
    const koreanTime = getKoreanTime();
    
    // Generate unique ID
    const classId = `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('Creating class:', { 
      classId,
      academyId: academyIdValue, 
      name,
      teacherId: teacherIdValue
    });

    // ✅ Class 테이블에 삽입 (파스칼 케이스), isActive = 1 명시
    await DB.prepare(`
      INSERT INTO Class (id, name, grade, description, academyId, teacherId, color, capacity, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      classId,
      name,
      grade || null,
      description || null,
      academyIdValue,
      teacherIdValue,
      classColor,
      classCapacity,
      koreanTime,
      koreanTime
    ).run();
    
    console.log('✅ Class created in Class table with isActive=1:', classId);

    // 학생 배정 (ClassStudent 테이블 사용)
    const finalStudentIds = students || studentIds;
    if (finalStudentIds && Array.isArray(finalStudentIds) && finalStudentIds.length > 0) {
      for (const studentId of finalStudentIds) {
        try {
          const studentIdStr = String(studentId);
          const csId = `cs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Check if already exists
          const existing = await DB.prepare(
            'SELECT id FROM ClassStudent WHERE classId = ? AND studentId = ?'
          ).bind(classId, studentIdStr).first();

          if (!existing) {
            await DB.prepare(
              'INSERT INTO ClassStudent (id, classId, studentId, enrolledAt) VALUES (?, ?, ?, ?)'
            ).bind(csId, classId, studentIdStr, koreanTime).run();
            console.log('✅ Student enrolled:', studentIdStr);
          }
        } catch (err: any) {
          console.error('❌ Student enrollment error:', err.message);
        }
      }
    }

    // 스케줄 추가 (ClassSchedule 테이블 사용)
    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      for (const schedule of schedules) {
        try {
          const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await DB.prepare(`
            INSERT INTO ClassSchedule (id, classId, subject, dayOfWeek, startTime, endTime, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            scheduleId,
            classId,
            schedule.subject || '수업',
            schedule.dayOfWeek,
            schedule.startTime,
            schedule.endTime,
            koreanTime
          ).run();
          
          console.log('✅ Schedule added:', schedule);
        } catch (err: any) {
          console.error('❌ Schedule error:', err.message);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      classId: classId,
      message: "반이 생성되었습니다"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Create class error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to create class",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
