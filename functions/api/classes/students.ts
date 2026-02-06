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

// GET: 반의 학생 목록 조회
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
    const classId = url.searchParams.get("classId");

    if (!classId) {
      return new Response(
        JSON.stringify({ success: false, error: "Class ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const students = await DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        cs.enrolledAt,
        cs.status
      FROM class_students cs
      JOIN users u ON cs.studentId = u.id
      WHERE cs.classId = ? AND cs.status = 'active'
      ORDER BY u.name ASC
    `).bind(parseInt(classId)).all();

    return new Response(
      JSON.stringify({
        success: true,
        students: students.results || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get class students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get class students",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST: 반에 학생 추가
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
    const { classId, studentIds } = body;

    if (!classId || !studentIds || !Array.isArray(studentIds)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();
    let addedCount = 0;
    let skippedCount = 0;

    for (const studentId of studentIds) {
      try {
        // 이미 등록되어 있는지 확인
        const existing = await DB.prepare(`
          SELECT id FROM class_students 
          WHERE classId = ? AND studentId = ?
        `).bind(classId, studentId).first();

        if (existing) {
          // 이미 존재하면 상태만 active로 변경
          await DB.prepare(`
            UPDATE class_students 
            SET status = 'active', enrolledAt = ?
            WHERE classId = ? AND studentId = ?
          `).bind(koreanTime, classId, studentId).run();
          skippedCount++;
        } else {
          // 새로 추가
          await DB.prepare(`
            INSERT INTO class_students (classId, studentId, enrolledAt, status)
            VALUES (?, ?, ?, ?)
          `).bind(classId, studentId, koreanTime, "active").run();
          addedCount++;
        }
      } catch (err) {
        console.error(`Failed to add student ${studentId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${addedCount}명 추가, ${skippedCount}명 이미 등록됨`,
        added: addedCount,
        skipped: skippedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Add class students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to add students",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// DELETE: 반에서 학생 제거
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const classId = url.searchParams.get("classId");
    const studentId = url.searchParams.get("studentId");

    if (!classId || !studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 상태를 inactive로 변경 (삭제하지 않고 비활성화)
    await DB.prepare(`
      UPDATE class_students 
      SET status = 'inactive'
      WHERE classId = ? AND studentId = ?
    `).bind(parseInt(classId), parseInt(studentId)).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "학생이 반에서 제거되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Remove class student error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to remove student",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
