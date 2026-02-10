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

    // 전역 관리자인지 확인
    const isGlobalAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

    // 1. 학생 수 조회 (academyId 필터링)
    let studentCountQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
    `;
    const studentParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      studentCountQuery += ` AND (CAST(academyId AS TEXT) = ? OR academyId = ?)`;
      studentParams.push(String(academyId), parseInt(academyId));
      console.log("🔍 Filtering students by academyId:", academyId);
    }

    let studentStmt = DB.prepare(studentCountQuery);
    studentParams.forEach(param => {
      studentStmt = studentStmt.bind(param);
    });
    const studentResult = await studentStmt.first();
    const totalStudents = (studentResult?.count as number) || 0;

    console.log("✅ Total students:", totalStudents, "for academyId:", academyId);

    // 2. 참여 학생 목록 (출석 또는 숙제 제출한 학생)
    let participatingQuery = `
      SELECT DISTINCT u.id, u.name, u.email,
        (SELECT COUNT(*) FROM attendance_records WHERE userId = u.id) as attendanceCount,
        (SELECT COUNT(*) FROM homework_submissions WHERE userId = u.id) as homeworkCount
      FROM users u
      WHERE u.role = 'STUDENT'
        AND u.id IN (
          SELECT DISTINCT userId FROM attendance_records
          UNION
          SELECT DISTINCT userId FROM homework_submissions
        )
    `;
    const participatingParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      participatingQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      participatingParams.push(String(academyId), parseInt(academyId));
    }

    participatingQuery += ` ORDER BY (attendanceCount + homeworkCount) DESC LIMIT 10`;

    let participatingStmt = DB.prepare(participatingQuery);
    participatingParams.forEach(param => {
      participatingStmt = participatingStmt.bind(param);
    });
    const participatingResult = await participatingStmt.all();
    const participatingStudents = participatingResult.results || [];

    // 3. 상위 활동 학생 (출석 + 숙제 제출 많은 순)
    let topActiveQuery = `
      SELECT u.id, u.name, u.email,
        COUNT(DISTINCT ar.id) as attendanceCount,
        COUNT(DISTINCT hs.id) as homeworkCount,
        (COUNT(DISTINCT ar.id) + COUNT(DISTINCT hs.id)) as totalActivity
      FROM users u
      LEFT JOIN attendance_records ar ON u.id = ar.userId
      LEFT JOIN homework_submissions hs ON u.id = hs.userId
      WHERE u.role = 'STUDENT'
    `;
    const topActiveParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      topActiveQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      topActiveParams.push(String(academyId), parseInt(academyId));
    }

    topActiveQuery += ` GROUP BY u.id, u.name, u.email
      HAVING totalActivity > 0
      ORDER BY totalActivity DESC
      LIMIT 5`;

    let topActiveStmt = DB.prepare(topActiveQuery);
    topActiveParams.forEach(param => {
      topActiveStmt = topActiveStmt.bind(param);
    });
    const topActiveResult = await topActiveStmt.all();
    const topActiveStudents = topActiveResult.results || [];

    // 4. 출석 기록 기반 활동 데이터
    let attendanceQuery = `
      SELECT COUNT(*) as count
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE u.role = 'STUDENT'
    `;
    const attendanceParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      attendanceQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      attendanceParams.push(String(academyId), parseInt(academyId));
    }

    let attendanceStmt = DB.prepare(attendanceQuery);
    attendanceParams.forEach(param => {
      attendanceStmt = attendanceStmt.bind(param);
    });
    const attendanceResult = await attendanceStmt.first();
    const totalAttendance = (attendanceResult?.count as number) || 0;

    // 5. 숙제 제출 기록 조회
    let homeworkQuery = `
      SELECT COUNT(*) as count
      FROM homework_submissions hs
      JOIN users u ON hs.userId = u.id
      WHERE u.role = 'STUDENT'
    `;
    const homeworkParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      homeworkQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      homeworkParams.push(String(academyId), parseInt(academyId));
    }

    let homeworkStmt = DB.prepare(homeworkQuery);
    homeworkParams.forEach(param => {
      homeworkStmt = homeworkStmt.bind(param);
    });
    const homeworkResult = await homeworkStmt.first();
    const totalHomework = (homeworkResult?.count as number) || 0;

    // 6. 평균 계산
    const averagePerStudent = totalStudents > 0 
      ? Math.round((totalAttendance + totalHomework) / totalStudents * 10) / 10
      : 0;

    // 7. 시간대별 활동 (출석 기록 기반)
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
      hourlyQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      hourlyParams.push(String(academyId), parseInt(academyId));
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

    // 8. 주제별 데이터 (숙제 제출 기반)
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
      subjectQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      subjectParams.push(String(academyId), parseInt(academyId));
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

    // 9. 자주 묻는 질문 (숙제 피드백 기반)
    let faqQuery = `
      SELECT DISTINCT feedback
      FROM homework_submissions hs
      JOIN users u ON hs.userId = u.id
      WHERE u.role = 'STUDENT' AND feedback IS NOT NULL AND feedback != ''
    `;
    const faqParams: any[] = [];

    if (!isGlobalAdmin && academyId) {
      faqQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      faqParams.push(String(academyId), parseInt(academyId));
    }

    faqQuery += ` LIMIT 5`;

    let faqStmt = DB.prepare(faqQuery);
    faqParams.forEach(param => {
      faqStmt = faqStmt.bind(param);
    });
    const faqResult = await faqStmt.all();
    const frequentQuestions = (faqResult.results || []).map((row: any) => row.feedback);

    console.log("✅ Analysis complete:", {
      totalStudents,
      participatingCount: participatingStudents.length,
      topActiveCount: topActiveStudents.length,
      totalActivity: totalAttendance + totalHomework
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          totalChats: totalAttendance + totalHomework,
          totalStudents,
          participatingStudents: participatingStudents.length,
          averagePerStudent,
          mostActiveTime,
          topTopics: topTopics.length > 0 ? topTopics : ["데이터 없음"],
        },
        participatingStudents: participatingStudents.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          activityCount: (s.attendanceCount || 0) + (s.homeworkCount || 0),
        })),
        topActiveStudents: topActiveStudents.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          attendanceCount: s.attendanceCount || 0,
          homeworkCount: s.homeworkCount || 0,
          totalActivity: s.totalActivity || 0,
        })),
        frequentQuestions: frequentQuestions.length > 0 ? frequentQuestions : ["데이터 없음"],
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
