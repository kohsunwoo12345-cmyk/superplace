interface Env {
  DB: D1Database;
}

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

// GET: 교사에게 배정된 반 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const teacherId = url.searchParams.get("teacherId");

    if (!teacherId) {
      return new Response(
        JSON.stringify({ success: false, error: "Teacher ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 교사에게 배정된 반 목록 조회 (실제 DB 스키마 사용)
    console.log('📚 Get teacher classes:', teacherId);
    
    const assignedClasses = await DB.prepare(`
      SELECT 
        c.id,
        c.class_name as name,
        c.grade,
        c.description,
        c.academy_id as academyId
      FROM classes c
      WHERE c.teacher_id = ?
      ORDER BY c.class_name ASC
    `).bind(parseInt(teacherId)).all();

    console.log('✅ Classes found:', assignedClasses.results?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        classes: assignedClasses.results || [],
        count: assignedClasses.results?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get teacher classes error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get teacher classes",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST: 교사에게 반 배정
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
    const { teacherId, classIds } = body;

    console.log('📝 Assign classes to teacher:', { teacherId, classIds });

    if (!teacherId || !Array.isArray(classIds)) {
      return new Response(
        JSON.stringify({ success: false, error: "Teacher ID and class IDs array are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 기존 배정 모두 제거 (teacher_id를 NULL로 설정)
    console.log('🔄 Removing existing assignments...');
    await DB.prepare(`
      UPDATE classes
      SET teacher_id = NULL
      WHERE teacher_id = ?
    `).bind(teacherId).run();

    // 새로운 반들에 교사 배정
    if (classIds.length > 0) {
      console.log('➕ Assigning new classes:', classIds);
      for (const classId of classIds) {
        await DB.prepare(`
          UPDATE classes
          SET teacher_id = ?
          WHERE id = ?
        `).bind(teacherId, classId).run();
      }
    }

    console.log('✅ Classes assigned successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: `${classIds.length}개의 반이 배정되었습니다`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Assign teacher to classes error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to assign teacher to classes",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
