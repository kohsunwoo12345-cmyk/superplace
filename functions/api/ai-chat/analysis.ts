interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const academyId = url.searchParams.get("academyId");

    console.log("🧠 AI Chat Analysis API called with:", { userId, role, academyId });

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // AI 채팅 기록이 실제로 없다면 목업 데이터 반환
    // TODO: chat_history 테이블이 생성되면 실제 데이터 조회로 변경
    
    // 전역 관리자인지 확인
    const isGlobalAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

    // 학생 수 조회 (academyId 필터링)
    let studentCountQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
    `;
    const studentParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      studentCountQuery += ` AND academyId = ?`;
      studentParams.push(academyId);
      console.log("🔍 Filtering students by academyId:", academyId);
    }

    let studentStmt = DB.prepare(studentCountQuery);
    studentParams.forEach(param => {
      studentStmt = studentStmt.bind(param);
    });
    const studentResult = await studentStmt.first();
    const totalStudents = (studentResult?.count as number) || 0;

    console.log("✅ Total students:", totalStudents, "for academyId:", academyId);

    // 출석 기록 기반 활동 데이터 (실제 DB 데이터 사용)
    let attendanceQuery = `
      SELECT COUNT(*) as count
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE u.role = 'STUDENT'
    `;
    const attendanceParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      attendanceQuery += ` AND u.academyId = ?`;
      attendanceParams.push(academyId);
    }

    let attendanceStmt = DB.prepare(attendanceQuery);
    attendanceParams.forEach(param => {
      attendanceStmt = attendanceStmt.bind(param);
    });
    const attendanceResult = await attendanceStmt.first();
    const totalAttendance = (attendanceResult?.count as number) || 0;

    // 숙제 제출 기록 조회
    let homeworkQuery = `
      SELECT COUNT(*) as count
      FROM homework_submissions hs
      JOIN users u ON hs.userId = u.id
      WHERE u.role = 'STUDENT'
    `;
    const homeworkParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      homeworkQuery += ` AND u.academyId = ?`;
      homeworkParams.push(academyId);
    }

    let homeworkStmt = DB.prepare(homeworkQuery);
    homeworkParams.forEach(param => {
      homeworkStmt = homeworkStmt.bind(param);
    });
    const homeworkResult = await homeworkStmt.first();
    const totalHomework = (homeworkResult?.count as number) || 0;

    // 평균 계산
    const averagePerStudent = totalStudents > 0 
      ? Math.round((totalAttendance + totalHomework) / totalStudents * 10) / 10
      : 0;

    // 시간대별 활동 (출석 기록 기반)
    let hourlyQuery = `
      SELECT 
        CAST(substr(ar.verifiedAt, 12, 2) AS INTEGER) as hour,
        COUNT(*) as count
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE u.role = 'STUDENT'
    `;
    const hourlyParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      hourlyQuery += ` AND u.academyId = ?`;
      hourlyParams.push(academyId);
    }

    hourlyQuery += ` GROUP BY hour ORDER BY hour`;

    let hourlyStmt = DB.prepare(hourlyQuery);
    hourlyParams.forEach(param => {
      hourlyStmt = hourlyStmt.bind(param);
    });
    const hourlyResult = await hourlyStmt.all();

    // 시간대별 데이터 포맷팅
    const hourlyData = (hourlyResult.results || []).map((row: any) => ({
      hour: `${String(row.hour).padStart(2, '0')}:00`,
      count: row.count || 0,
    }));

    // 가장 활동적인 시간대 찾기
    let mostActiveHour = 0;
    let maxCount = 0;
    (hourlyResult.results || []).forEach((row: any) => {
      if (row.count > maxCount) {
        maxCount = row.count;
        mostActiveHour = row.hour;
      }
    });
    const mostActiveTime = mostActiveHour > 0 
      ? `${String(mostActiveHour).padStart(2, '0')}:00 ~ ${String(mostActiveHour + 3).padStart(2, '0')}:00`
      : "데이터 없음";

    // 주제별 데이터 (숙제 제출 기반)
    let subjectQuery = `
      SELECT 
        subject,
        COUNT(*) as count
      FROM homework_submissions hs
      JOIN users u ON hs.userId = u.id
      WHERE u.role = 'STUDENT' AND subject IS NOT NULL AND subject != ''
    `;
    const subjectParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      subjectQuery += ` AND u.academyId = ?`;
      subjectParams.push(academyId);
    }

    subjectQuery += ` GROUP BY subject ORDER BY count DESC LIMIT 5`;

    let subjectStmt = DB.prepare(subjectQuery);
    subjectParams.forEach(param => {
      subjectStmt = subjectStmt.bind(param);
    });
    const subjectResult = await subjectStmt.all();

    const topTopics = (subjectResult.results || []).map((row: any) => row.subject);
    const topicData = (subjectResult.results || []).map((row: any, index: number) => {
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
      return {
        name: row.subject,
        value: row.count,
        color: colors[index % colors.length],
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          totalChats: totalAttendance + totalHomework,
          totalStudents,
          averagePerStudent,
          mostActiveTime,
          topTopics: topTopics.length > 0 ? topTopics : ["데이터 없음"],
        },
        hourlyData,
        topicData: topicData.length > 0 ? topicData : [
          { name: "데이터 없음", value: 1, color: "#9ca3af" }
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ AI Chat Analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch AI chat analysis",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
