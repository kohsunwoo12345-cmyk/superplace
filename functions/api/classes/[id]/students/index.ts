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
 * GET /api/classes/[id]/students
 * 클래스에 배정된 학생 목록 조회 (ClassStudent 테이블 사용)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const classId = context.params.id as string;
    console.log('👥 Get class students:', classId);

    // ClassStudent 테이블에서 해당 classId의 학생들 조회
    const result = await DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.academyId,
        cs.enrolledAt
      FROM ClassStudent cs
      INNER JOIN User u ON cs.studentId = u.id
      WHERE cs.classId = ?
      ORDER BY u.name
    `).bind(classId).all();

    const students = (result.results || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      academyId: s.academyId,
      enrolledAt: s.enrolledAt
    }));

    console.log('✅ Students found:', students.length);

    return new Response(
      JSON.stringify({
        success: true,
        students: students,
        count: students.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Get students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get students",
        message: error.message,
        students: []
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/classes/[id]/students
 * 클래스에 학생 추가 (ClassStudent 테이블 사용)
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

    const classId = context.params.id as string;
    const body: any = await context.request.json();
    const { studentIds } = body;

    console.log('➕ Add students to class:', classId, studentIds);

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "studentIds is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let addedCount = 0;
    let skippedCount = 0;

    // 각 학생을 ClassStudent 테이블에 추가
    for (const studentId of studentIds) {
      try {
        // 이미 등록되어 있는지 확인
        const existing = await DB.prepare(`
          SELECT id FROM ClassStudent
          WHERE classId = ? AND studentId = ?
        `).bind(classId, String(studentId)).first();

        if (existing) {
          console.log(`⚠️ Student ${studentId} already in class ${classId}`);
          skippedCount++;
          continue;
        }

        // ClassStudent 레코드 생성
        const csId = `cs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await DB.prepare(`
          INSERT INTO ClassStudent (id, classId, studentId, enrolledAt)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(csId, classId, String(studentId)).run();
        
        console.log(`✅ Student ${studentId} assigned to class ${classId} with id ${csId}`);
        addedCount++;
      } catch (error: any) {
        console.error('⚠️ Failed to assign student:', studentId, error.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `학생 ${addedCount}명이 추가되었습니다${skippedCount > 0 ? ` (${skippedCount}명은 이미 등록됨)` : ''}`,
        added: addedCount,
        skipped: skippedCount
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Add students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to add students",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
