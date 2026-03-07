interface Env {
  DB: D1Database;
}

// 한국 날짜 (KST) 생성 함수
function getKoreanDate(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // URL에서 파라미터 추출
    const url = new URL(context.request.url);
    const studentId = url.searchParams.get("studentId");
    const academyId = url.searchParams.get("academyId");

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "Student ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 학생 숙제 조회 시작:', {
      studentId,
      studentIdType: typeof studentId,
      academyId
    });

    const today = getKoreanDate();

    // 학생 정보 조회 (studentId는 문자열)
    const student = await DB.prepare(`
      SELECT id, name, academyId FROM User WHERE id = ?
    `).bind(studentId).first();

    if (!student) {
      console.error("❌ Student not found:", studentId);
      return new Response(
        JSON.stringify({ success: false, error: "Student not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Student found:", student);

    // 학생에게 부여된 숙제 조회
    // 1. 전체 학생 대상 (targetType = 'all', 같은 학원)
    // 2. 특정 학생 대상 (targetType = 'specific', 본인이 targets 테이블에 있음)
    console.log("📚 Querying homework assignments...");
    console.log("   studentId:", studentId, "type:", typeof studentId);
    console.log("   student.academyId:", student.academyId, "type:", typeof student.academyId);
    
    const allAssignments = await DB.prepare(`
      SELECT DISTINCT
        ha.id,
        ha.teacherId,
        ha.teacherName,
        ha.title,
        ha.description,
        ha.subject,
        ha.dueDate,
        ha.createdAt,
        ha.targetType,
        hat.status as submissionStatus,
        hat.submissionId
      FROM homework_assignments ha
      LEFT JOIN homework_assignment_targets hat 
        ON ha.id = hat.assignmentId AND hat.studentId = ?
      WHERE ha.status = 'active'
        AND ha.academyId = ?
        AND (
          ha.targetType = 'all'
          OR (ha.targetType = 'specific' AND hat.studentId IS NOT NULL)
        )
        AND ha.dueDate >= ?
      ORDER BY ha.dueDate ASC, ha.createdAt DESC
    `).bind(
      studentId,
      student.academyId,
      today
    ).all();

    console.log("✅ Found assignments:", allAssignments.results?.length || 0);
    if (allAssignments.results && allAssignments.results.length > 0) {
      console.log("📋 첫 번째 숙제:", allAssignments.results[0]);
    }

    // 제출된 숙제 정보 조회 (studentId는 문자열)
    // 실제 DB 스키마: userId (not studentId)
    // 사용 가능한 컬럼: id, userId, submittedAt, gradedAt, score, feedback, subject, createdAt
    const submittedHomework = await DB.prepare(`
      SELECT 
        hs.id,
        hs.submittedAt,
        hs.score,
        hs.feedback,
        hs.subject,
        hs.gradedAt
      FROM homework_submissions hs
      WHERE hs.userId = ?
      ORDER BY hs.submittedAt DESC
      LIMIT 10
    `).bind(studentId).all();

    // 오늘의 숙제 (오늘이 마감일)
    const todayHomework = (allAssignments.results || []).filter((hw: any) => 
      hw.dueDate.startsWith(today)
    );

    // 다가오는 숙제 (오늘 이후)
    const upcomingHomework = (allAssignments.results || []).filter((hw: any) => 
      !hw.dueDate.startsWith(today) && hw.dueDate >= today
    );

    return new Response(
      JSON.stringify({
        success: true,
        today: today,
        todayHomework: todayHomework,
        upcomingHomework: upcomingHomework,
        allAssignments: allAssignments.results || [],
        submittedHomework: submittedHomework.results || [],
        summary: {
          todayCount: todayHomework.length,
          upcomingCount: upcomingHomework.length,
          submittedCount: submittedHomework.results?.length || 0,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get student homework error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get student homework",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
