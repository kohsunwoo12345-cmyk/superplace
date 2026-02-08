interface Env {
  DB: D1Database;
}

/**
 * 출석 현황 조회 API
 * GET /api/attendance/today?date=2024-01-01&academyId=1&role=ADMIN
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const academyId = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');
    const email = url.searchParams.get('email');

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📊 Attendance query:', { date, academyId, role, email });

    // 관리자는 모든 출석 조회
    const isAdmin = email === 'admin@superplace.co.kr' || role === 'ADMIN' || role === 'SUPER_ADMIN';

    // 1. 출석 기록 조회 (attendance_records_v2)
    // checkInTime이 "2024-01-01 09:00:00" 형식이므로 SUBSTR로 날짜 추출
    let attendanceQuery = `
      SELECT 
        ar.id,
        ar.userId,
        ar.code,
        ar.checkInTime,
        ar.status,
        ar.academyId,
        u.name as userName,
        u.email as userEmail,
        hs.id as homeworkId,
        hs.submittedAt as homeworkSubmittedAt,
        hg.score as homeworkScore,
        hg.feedback as homeworkFeedback,
        hg.completion as homeworkCompletion
      FROM attendance_records_v2 ar
      LEFT JOIN users u ON u.id = ar.userId
      LEFT JOIN homework_submissions_v2 hs ON hs.code = ar.code
      LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
      WHERE SUBSTR(ar.checkInTime, 1, 10) = ?
    `;

    const queryParams: any[] = [date];

    // 관리자가 아니면 학원 필터링
    if (!isAdmin && academyId) {
      attendanceQuery += ` AND ar.academyId = ?`;
      queryParams.push(academyId);
    }

    attendanceQuery += ` ORDER BY ar.checkInTime DESC`;

    const attendanceResult = await DB.prepare(attendanceQuery).bind(...queryParams).all();

    // 2. 통계 계산
    const records = attendanceResult.results;
    const totalStudents = records.length;
    const presentCount = records.filter((r: any) => r.status === 'PRESENT' || r.status === 'VERIFIED').length;
    const lateCount = records.filter((r: any) => r.status === 'LATE').length;
    const homeworkSubmittedCount = records.filter((r: any) => r.homeworkId).length;
    
    let avgScore = 0;
    const scoredHomework = records.filter((r: any) => r.homeworkScore);
    if (scoredHomework.length > 0) {
      const totalScore = scoredHomework.reduce((sum: number, r: any) => sum + (r.homeworkScore || 0), 0);
      avgScore = Math.round(totalScore / scoredHomework.length);
    }

    // 3. 출석 기록 포맷팅
    const formattedRecords = records.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      code: r.code,
      verifiedAt: r.checkInTime,
      status: r.status,
      statusText: r.status === 'LATE' ? '지각' : '출석',
      homeworkSubmitted: !!r.homeworkId,
      homeworkSubmittedAt: r.homeworkSubmittedAt,
      homework: r.homeworkId ? {
        score: r.homeworkScore,
        feedback: r.homeworkFeedback,
        completion: r.homeworkCompletion,
        subject: 'Homework'
      } : null
    }));

    return new Response(
      JSON.stringify({
        success: true,
        date,
        stats: {
          totalStudents,
          presentCount,
          lateCount,
          absentCount: 0, // 계산 필요 시 추가
          homeworkSubmittedCount,
          homeworkCompletionRate: totalStudents > 0 ? Math.round((homeworkSubmittedCount / totalStudents) * 100) : 0,
          avgScore,
          attendanceRate: totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0
        },
        records: formattedRecords
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Today attendance error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch today attendance",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
