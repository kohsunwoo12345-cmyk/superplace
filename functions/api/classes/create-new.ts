// 클래스 생성 API - 완전히 새로 작성
// academyId를 어떤 형태로든 받아서 문자열로 저장

interface Env {
  DB: D1Database;
}

function getKoreanTime(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kst.toISOString().slice(0, 19).replace('T', ' ');
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

    const body = await context.request.json();
    const { academyId, name, grade, description, teacherId, color, schedules, studentIds } = body;

    if (!name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required field: name" 
      }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const academyIdValue = academyId ? String(academyId) : null;
    const teacherIdValue = teacherId ? String(teacherId) : null;
    const classColor = color || '#3B82F6';
    const koreanTime = getKoreanTime();

    console.log('Creating class:', { academyIdValue, name });

    const result = await DB.prepare(`
      INSERT INTO classes (academy_id, class_name, grade, description, teacher_id, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(academyIdValue, name, grade || null, description || null, teacherIdValue, classColor, koreanTime).run();
    
    const classId = result.meta.last_row_id;

    console.log('Class created:', classId);

    // 학생 배정
    if (studentIds && Array.isArray(studentIds)) {
      for (const studentId of studentIds) {
        try {
          const studentIdStr = String(studentId);
          const existing = await DB.prepare(
            'SELECT id FROM class_students WHERE classId = ? AND studentId = ?'
          ).bind(classId, studentIdStr).first();

          if (existing) {
            await DB.prepare(
              'UPDATE class_students SET status = ?, enrolledAt = ? WHERE classId = ? AND studentId = ?'
            ).bind('active', koreanTime, classId, studentIdStr).run();
          } else {
            await DB.prepare(
              'INSERT INTO class_students (classId, studentId, enrolledAt, status) VALUES (?, ?, ?, ?)'
            ).bind(classId, studentIdStr, koreanTime, 'active').run();
          }
        } catch (err) {
          console.error('Student enrollment error:', err);
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
