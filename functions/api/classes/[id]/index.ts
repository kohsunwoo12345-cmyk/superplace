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
 * PUT /api/classes/[id]
 * 클래스 정보 업데이트
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const classId = context.params.id as string;
    const body: any = await context.request.json();
    const { name, grade, description, color, schedules } = body;

    console.log('📝 Update class:', classId, body);

    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: "Name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();

    // 스케줄 데이터 준비
    let scheduleDays = null;
    let startTime = null;
    let endTime = null;
    let daySchedule = null;

    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      const schedule = schedules[0];
      if (Array.isArray(schedule.dayOfWeek) && schedule.dayOfWeek.length > 0) {
        scheduleDays = JSON.stringify(schedule.dayOfWeek);
        startTime = schedule.startTime;
        endTime = schedule.endTime;
        
        daySchedule = JSON.stringify(schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          subject: s.subject || null,
          room: s.room || null
        })));
      }
    }

    // 클래스 정보 업데이트 (실제 D1 스키마 사용)
    await DB.prepare(`
      UPDATE classes 
      SET 
        class_name = ?,
        grade = ?,
        description = ?,
        color = ?,
        schedule_days = ?,
        start_time = ?,
        end_time = ?,
        day_schedule = ?
      WHERE id = ?
    `).bind(
      name,
      grade || null,
      description || null,
      color || '#3B82F6',
      scheduleDays,
      startTime,
      endTime,
      daySchedule,
      parseInt(classId)
    ).run();

    console.log('✅ Class updated:', classId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "클래스가 업데이트되었습니다"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Update class error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to update class",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/classes/[id]
 * 클래스 삭제
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const classId = context.params.id as string;
    console.log('🗑️ Delete class:', classId);

    // 학생 배정 해제 (students.class_id를 NULL로)
    await DB.prepare(`
      UPDATE students 
      SET class_id = NULL 
      WHERE class_id = ?
    `).bind(parseInt(classId)).run();

    // 클래스 삭제
    await DB.prepare(`
      DELETE FROM classes WHERE id = ?
    `).bind(parseInt(classId)).run();

    console.log('✅ Class deleted:', classId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "클래스가 삭제되었습니다"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Delete class error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to delete class",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
