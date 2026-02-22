interface Env {
  DB: D1Database;
}

// 한국 시간 생성
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * POST /api/classes/create
 * 새 클래스 생성 - 완전히 재작성된 버전
 * academyId를 어떤 형태로든 받아서 문자열로 저장
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const { 
      academyId, 
      name, 
      grade, 
      subject, 
      description, 
      teacherId,
      color,
      schedules,
      studentIds
    } = body;

    console.log('📚 Create class request:', { 
      academyId, 
      academyIdType: typeof academyId,
      name, 
      color 
    });

    // 필수 필드 검증
    if (!name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required field: name" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();
    const classColor = color || '#3B82F6';
    
    // academyId와 teacherId를 있는 그대로 문자열로 변환
    // 어떤 형태든 받아들임: 숫자, 문자열, UUID 등
    const academyIdValue = academyId ? String(academyId) : null;
    const teacherIdValue = teacherId ? String(teacherId) : null;
    
    console.log('🔑 IDs:', { 
      academyId: academyIdValue,
      teacherId: teacherIdValue
    });

    // INSERT 실행
    console.log('📝 Inserting into classes table...');
    
    const createClassResult = await DB.prepare(`
      INSERT INTO classes (
        academy_id, 
        class_name, 
        grade, 
        description, 
        teacher_id, 
        color,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      academyIdValue,
      name,
      grade || null,
      description || null,
      teacherIdValue,
      classColor,
      koreanTime
    ).run();
    
    const classId = createClassResult.meta.last_row_id;
    console.log('✅ Class created successfully!', {
      classId,
      academy_id: academyIdValue,
      class_name: name
    });

    // 학생 배정 (있다면)
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      console.log('👥 Enrolling students:', studentIds.length);
      
      for (const studentId of studentIds) {
        try {
          const studentIdStr = String(studentId);
          
          // class_students 테이블에 추가
          const existing = await DB.prepare(`
            SELECT id FROM class_students 
            WHERE classId = ? AND studentId = ?
          `).bind(classId, studentIdStr).first();

          if (existing) {
            await DB.prepare(`
              UPDATE class_students 
              SET status = 'active', enrolledAt = ?
              WHERE classId = ? AND studentId = ?
            `).bind(koreanTime, classId, studentIdStr).run();
          } else {
            await DB.prepare(`
              INSERT INTO class_students (classId, studentId, enrolledAt, status)
              VALUES (?, ?, ?, ?)
            `).bind(classId, studentIdStr, koreanTime, 'active').run();
          }
        } catch (error: any) {
          console.error('⚠️ Failed to assign student:', studentId, error.message);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        classId: classId,
        message: "반이 생성되었습니다"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Create class error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create class",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
