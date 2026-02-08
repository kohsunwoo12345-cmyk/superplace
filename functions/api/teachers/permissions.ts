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

// GET: 선생님 권한 조회
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
    const academyId = url.searchParams.get("academyId");

    if (!teacherId && !academyId) {
      return new Response(
        JSON.stringify({ success: false, error: "Teacher ID or Academy ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let query = `
      SELECT 
        tp.id,
        tp.teacherId,
        u.name as teacherName,
        u.email as teacherEmail,
        tp.academyId,
        tp.canViewAllClasses,
        tp.canViewAllStudents,
        tp.canManageHomework,
        tp.canManageAttendance,
        tp.canViewStatistics,
        tp.createdAt,
        tp.updatedAt
      FROM teacher_permissions tp
      JOIN users u ON tp.teacherId = u.id
      WHERE 1=1
    `;

    const bindings: any[] = [];

    if (teacherId) {
      query += ` AND tp.teacherId = ?`;
      bindings.push(parseInt(teacherId));
    }

    if (academyId) {
      query += ` AND tp.academyId = ?`;
      bindings.push(parseInt(academyId));
    }

    const permissions = await DB.prepare(query).bind(...bindings).all();

    return new Response(
      JSON.stringify({
        success: true,
        permissions: permissions.results || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get teacher permissions error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get permissions",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST: 선생님 권한 생성 또는 업데이트
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
      teacherId,
      academyId,
      canViewAllClasses,
      canViewAllStudents,
      canManageHomework,
      canManageAttendance,
      canViewStatistics,
    } = body;

    if (!teacherId || !academyId) {
      return new Response(
        JSON.stringify({ success: false, error: "Teacher ID and Academy ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();

    // 이미 존재하는지 확인
    const existing = await DB.prepare(`
      SELECT id FROM teacher_permissions 
      WHERE teacherId = ? AND academyId = ?
    `).bind(teacherId, academyId).first();

    if (existing) {
      // 업데이트
      await DB.prepare(`
        UPDATE teacher_permissions 
        SET 
          canViewAllClasses = ?,
          canViewAllStudents = ?,
          canManageHomework = ?,
          canManageAttendance = ?,
          canViewStatistics = ?,
          updatedAt = ?
        WHERE teacherId = ? AND academyId = ?
      `).bind(
        canViewAllClasses ? 1 : 0,
        canViewAllStudents ? 1 : 0,
        canManageHomework ? 1 : 0,
        canManageAttendance ? 1 : 0,
        canViewStatistics ? 1 : 0,
        koreanTime,
        teacherId,
        academyId
      ).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: "권한이 업데이트되었습니다",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // 새로 생성
      await DB.prepare(`
        INSERT INTO teacher_permissions 
        (teacherId, academyId, canViewAllClasses, canViewAllStudents, canManageHomework, canManageAttendance, canViewStatistics, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        teacherId,
        academyId,
        canViewAllClasses ? 1 : 0,
        canViewAllStudents ? 1 : 0,
        canManageHomework !== undefined ? (canManageHomework ? 1 : 0) : 1,
        canManageAttendance !== undefined ? (canManageAttendance ? 1 : 0) : 1,
        canViewStatistics ? 1 : 0,
        koreanTime,
        koreanTime
      ).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: "권한이 생성되었습니다",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Set teacher permissions error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to set permissions",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
