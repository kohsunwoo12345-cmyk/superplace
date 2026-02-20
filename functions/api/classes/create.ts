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
 * 새 클래스 생성
 * 실제 D1 스키마에 맞춘 버전 (snake_case 컬럼명 사용)
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
      schedules, // [{ dayOfWeek: number[], startTime, endTime, subject?, room? }]
      studentIds // [userId1, userId2, ...]
    } = body;

    console.log('📚 Create class request:', { academyId, name, color, schedules, studentIds });

    // 필수 필드 검증
    if (!academyId || !name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: academyId, name" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();
    const classColor = color || '#3B82F6';
    
    // academyId와 teacherId를 정수로 변환
    const academyIdInt = parseInt(String(academyId).split('.')[0]);
    const teacherIdInt = teacherId ? parseInt(String(teacherId).split('.')[0]) : null;

    // 스케줄 정보 처리 (여러 요일을 JSON 배열로 저장)
    let scheduleDays = null;
    let startTime = null;
    let endTime = null;
    let daySchedule = null;

    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      const schedule = schedules[0]; // 첫 번째 스케줄 사용
      if (Array.isArray(schedule.dayOfWeek) && schedule.dayOfWeek.length > 0) {
        // dayOfWeek 배열을 JSON 문자열로 변환
        scheduleDays = JSON.stringify(schedule.dayOfWeek);
        startTime = schedule.startTime;
        endTime = schedule.endTime;
        
        // day_schedule도 전체 스케줄 정보를 JSON으로 저장
        daySchedule = JSON.stringify(schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          subject: s.subject || null,
          room: s.room || null
        })));
      }
    }

    // 1. 클래스 생성 (실제 D1 스키마의 snake_case 컬럼명 사용)
    console.log('📝 Creating class with actual D1 schema...');
    
    const createClassResult = await DB.prepare(`
      INSERT INTO classes (
        academy_id, 
        class_name, 
        grade, 
        description, 
        teacher_id, 
        color,
        schedule_days,
        start_time,
        end_time,
        day_schedule,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      academyIdInt,
      name,
      (grade && grade.trim()) ? grade.trim() : null,  // 빈 문자열도 null로 처리
      description || null,
      teacherIdInt,
      classColor,
      scheduleDays,
      startTime,
      endTime,
      daySchedule,
      koreanTime
    ).run();
    
    const classId = createClassResult.meta.last_row_id;
    console.log('✅ Class created with ID:', classId);

    // 2. 학생 배정 (class_students 테이블과 students 테이블 모두 업데이트)
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      console.log('👥 Enrolling students:', studentIds.length);
      
      for (const studentId of studentIds) {
        try {
          const studentIdInt = parseInt(String(studentId).split('.')[0]);
          
          // 2-1. students 테이블에 class_id 업데이트 (있다면)
          try {
            await DB.prepare(`
              UPDATE students 
              SET class_id = ? 
              WHERE user_id = ?
            `).bind(classId, studentIdInt).run();
            console.log(`✅ Student ${studentIdInt} assigned to class ${classId} in students table`);
          } catch (error: any) {
            console.log('⚠️ students table update skipped:', error.message);
          }
          
          // 2-2. class_students 테이블에 관계 생성 (학생 대시보드에서 보이도록)
          try {
            // 이미 등록되어 있는지 확인
            const existing = await DB.prepare(`
              SELECT id FROM class_students 
              WHERE classId = ? AND studentId = ?
            `).bind(classId, studentIdInt).first();

            if (existing) {
              // 이미 존재하면 상태만 active로 변경
              await DB.prepare(`
                UPDATE class_students 
                SET status = 'active', enrolledAt = ?
                WHERE classId = ? AND studentId = ?
              `).bind(koreanTime, classId, studentIdInt).run();
              console.log(`✅ Student ${studentIdInt} reactivated in class_students`);
            } else {
              // 새로 추가
              await DB.prepare(`
                INSERT INTO class_students (classId, studentId, enrolledAt, status)
                VALUES (?, ?, ?, ?)
              `).bind(classId, studentIdInt, koreanTime, 'active').run();
              console.log(`✅ Student ${studentIdInt} added to class_students`);
            }
          } catch (error: any) {
            console.log('⚠️ class_students table update skipped:', error.message);
          }
          
        } catch (error: any) {
          console.error('⚠️ Failed to assign student:', studentId, error.message);
          // 에러가 나도 계속 진행
        }
      }
      console.log('✅ Students enrollment completed');
    }

    return new Response(
      JSON.stringify({
        success: true,
        classId: classId,
        message: "반이 생성되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Create class error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create class",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
