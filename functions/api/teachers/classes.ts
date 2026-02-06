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

    // 교사에게 배정된 반 목록 조회
    const assignedClasses = await DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.grade,
        c.subject,
        c.description,
        c.academyId,
        c.status
      FROM classes c
      WHERE c.teacherId = ? AND c.status = 'active'
      ORDER BY c.name ASC
    `).bind(parseInt(teacherId)).all();

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

    if (!teacherId || !Array.isArray(classIds)) {
      return new Response(
        JSON.stringify({ success: false, error: "Teacher ID and class IDs array are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 기존 배정 모두 제거 (teacherId를 NULL로 설정)
    await DB.prepare(`
      UPDATE classes
      SET teacherId = NULL
      WHERE teacherId = ?
    `).bind(teacherId).run();

    // 새로운 반들에 교사 배정
    if (classIds.length > 0) {
      for (const classId of classIds) {
        await DB.prepare(`
          UPDATE classes
          SET teacherId = ?
          WHERE id = ?
        `).bind(teacherId, classId).run();
      }
    }

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
