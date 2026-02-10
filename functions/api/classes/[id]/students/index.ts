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
 * 클래스에 배정된 학생 목록 조회
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

    // students 테이블에서 해당 class_id의 학생들 조회
    const result = await DB.prepare(`
      SELECT 
        s.id,
        s.user_id,
        u.name,
        u.email,
        u.phone,
        u.academy_id as academyId
      FROM students s
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.class_id = ?
      ORDER BY u.name
    `).bind(parseInt(classId)).all();

    const students = (result.results || []).map((s: any) => ({
      id: s.user_id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      academyId: s.academyId
    }));

    console.log('✅ Students found:', students.length);

    return new Response(
      JSON.stringify({
        success: true,
        students: students
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
 * 클래스에 학생 추가
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

    // 각 학생의 class_id 업데이트
    for (const studentId of studentIds) {
      try {
        const studentIdInt = parseInt(String(studentId).split('.')[0]);
        await DB.prepare(`
          UPDATE students 
          SET class_id = ? 
          WHERE user_id = ?
        `).bind(parseInt(classId), studentIdInt).run();
        
        console.log(`✅ Student ${studentIdInt} assigned to class ${classId}`);
      } catch (error: any) {
        console.error('⚠️ Failed to assign student:', studentId, error.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "학생이 추가되었습니다"
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
