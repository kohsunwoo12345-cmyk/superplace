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

    const today = getKoreanDate();

    // 학생 정보 조회
    const student = await DB.prepare(`
      SELECT id, name, academy_id as academyId FROM users WHERE id = ?
    `).bind(parseInt(studentId)).first();

    if (!student) {
      console.error("❌ Student not found:", studentId);
      return new Response(
        JSON.stringify({ success: false, error: "Student not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Student found:", student);

    // 학생에게 부여된 숙제 조회
    // 1. 전체 학생 대상 (같은 학원)
    // 2. 특정 학생 대상 (본인)
    console.log("📚 Querying homework assignments...");
    console.log("   studentId:", studentId);
    console.log("   student.academyId:", student.academyId);
    
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
        AND (
          ha.academyId IS NULL 
          OR CAST(ha.academyId AS TEXT) = ? 
          OR ha.academyId = ?
        )
        AND (
          ha.targetType = 'all'
          OR (ha.targetType = 'specific' AND hat.studentId = ?)
        )
        AND ha.dueDate >= ?
      ORDER BY ha.dueDate ASC, ha.createdAt DESC
    `).bind(
      parseInt(studentId),
      String(student.academyId),  // 문자열로 비교
      parseInt(student.academyId || '0'),  // 정수로도 비교
      parseInt(studentId),
      today
    ).all();

    console.log("✅ Found assignments:", allAssignments.results?.length || 0);

    // 제출된 숙제 정보 조회
    const submittedHomework = await DB.prepare(`
      SELECT 
        hs.id,
        hs.attendanceRecordId,
        hs.score,
        hs.feedback,
        hs.subject,
        hs.completion,
        hs.effort,
        hs.submittedAt,
        hs.gradedAt
      FROM homework_submissions hs
      WHERE hs.userId = ?
      ORDER BY hs.submittedAt DESC
      LIMIT 10
    `).bind(parseInt(studentId)).all();

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
