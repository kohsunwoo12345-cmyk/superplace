interface Env {
  DB: D1Database;
}

// 한국 날짜 (KST)
function getKoreanDate(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 이번 달 시작일 (KST)
function getKoreanMonth(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  
  return `${year}-${month}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const authHeader = context.request.headers.get("Authorization");
    
    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 사용자 인증 (선택사항: 토큰에서 academyId 추출 가능)
    // 현재는 모든 학원의 데이터를 반환 (추후 academyId 필터링 추가)

    const today = getKoreanDate();
    const thisMonth = getKoreanMonth();

    // 1. 전체 학생 수
    const totalStudentsResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'
    `).first();
    const totalStudents = totalStudentsResult?.count || 0;

    // 2. 오늘 출석 현황
    const todayAttendanceResult = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as attended
      FROM attendance_records
      WHERE substr(verifiedAt, 1, 10) = ?
    `).bind(today).first();
    
    const attendedToday = todayAttendanceResult?.attended || 0;
    const attendanceRate = totalStudents > 0 
      ? Math.round((attendedToday / totalStudents) * 100) 
      : 0;

    // 3. 오늘 숙제 제출 현황
    const todayHomeworkResult = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as graded
      FROM homework_submissions
      WHERE substr(submittedAt, 1, 10) = ?
    `).bind(today).first();
    
    const homeworkSubmittedToday = todayHomeworkResult?.total || 0;
    const homeworkGradedToday = todayHomeworkResult?.graded || 0;

    // 4. 숙제 미제출 학생 (오늘 출석했지만 숙제 미제출)
    const missingHomeworkResult = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM attendance_records ar
      LEFT JOIN homework_submissions hs ON ar.id = hs.attendanceRecordId
      WHERE substr(ar.verifiedAt, 1, 10) = ?
      AND ar.homeworkSubmitted = 0
    `).bind(today).first();
    const missingHomework = missingHomeworkResult?.count || 0;

    // 5. 최근 출석 알림 (오늘 출석한 학생 목록)
    const recentAttendanceList = await DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ar.verifiedAt,
        ar.homeworkSubmitted
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE substr(ar.verifiedAt, 1, 10) = ?
      ORDER BY ar.verifiedAt DESC
      LIMIT 10
    `).bind(today).all();

    // 6. 최근 숙제 채점 결과
    const recentHomeworkList = await DB.prepare(`
      SELECT 
        u.id,
        u.name,
        hs.score,
        hs.subject,
        hs.completion,
        hs.effort,
        hs.feedback,
        hs.submittedAt
      FROM homework_submissions hs
      JOIN users u ON hs.userId = u.id
      WHERE substr(hs.submittedAt, 1, 10) = ?
      ORDER BY hs.submittedAt DESC
      LIMIT 10
    `).bind(today).all();

    // 7. 숙제 미제출 학생 목록
    const missingHomeworkList = await DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ar.verifiedAt
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      LEFT JOIN homework_submissions hs ON ar.id = hs.attendanceRecordId
      WHERE substr(ar.verifiedAt, 1, 10) = ?
      AND hs.id IS NULL
      ORDER BY ar.verifiedAt DESC
      LIMIT 10
    `).bind(today).all();

    // 8. 선생님 목록 (학원장용)
    const teachersResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'TEACHER'
    `).first();
    const totalTeachers = teachersResult?.count || 0;

    // 9. 최근 활동 로그
    const recentActivities = [
      ...recentAttendanceList.results.map((item: any) => ({
        type: 'attendance',
        description: `${item.name}님이 출석했습니다`,
        time: item.verifiedAt,
      })),
      ...recentHomeworkList.results.map((item: any) => ({
        type: 'homework',
        description: `${item.name}님이 숙제를 제출했습니다 (${item.score}점)`,
        time: item.submittedAt,
      }))
    ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);

    return new Response(
      JSON.stringify({
        success: true,
        // 기본 통계
        totalStudents,
        totalTeachers,
        attendanceRate,
        activeHomework: missingHomework,
        totalClasses: 0,
        
        // 오늘 현황
        todayStats: {
          attendance: attendedToday,
          homeworkSubmitted: homeworkSubmittedToday,
          homeworkGraded: homeworkGradedToday,
          missingHomework: missingHomework,
        },

        // 출석 알림
        attendanceAlerts: recentAttendanceList.results.map((item: any) => ({
          studentId: item.id,
          studentName: item.name,
          time: item.verifiedAt,
          homeworkSubmitted: item.homeworkSubmitted === 1,
        })),

        // 숙제 검사 결과
        homeworkResults: recentHomeworkList.results.map((item: any) => ({
          studentId: item.id,
          studentName: item.name,
          score: item.score,
          subject: item.subject,
          completion: item.completion,
          effort: item.effort,
          feedback: item.feedback,
          submittedAt: item.submittedAt,
        })),

        // 숙제 미제출 목록
        missingHomeworkList: missingHomeworkList.results.map((item: any) => ({
          studentId: item.id,
          studentName: item.name,
          email: item.email,
          attendedAt: item.verifiedAt,
        })),

        // 최근 활동
        recentActivities,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Director dashboard stats error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch dashboard stats",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
