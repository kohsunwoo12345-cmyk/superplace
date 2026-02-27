interface Env {
  DB: D1Database;
}

// 원장/교사 대시보드 통계
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');
    const userId = url.searchParams.get('userId');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!academyId) {
      return new Response(JSON.stringify({ error: "Academy ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. 학원의 학생 수
    const studentsCount = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'STUDENT' AND academyId = ?
    `).bind(parseInt(academyId)).first();

    // 2. 학원의 선생님 수
    const teachersCount = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'TEACHER' AND academyId = ?
    `).bind(parseInt(academyId)).first();

    // 3. 학원의 반 수
    const classesCount = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM classes 
      WHERE academyId = ?
    `).bind(parseInt(academyId)).first();

    // 4. 오늘 출석
    const todayAttendance = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM attendance
      WHERE academyId = ?
        AND date(date) = date('now')
        AND status = 'present'
    `).bind(parseInt(academyId)).first();

    // 5. 이번 달 출석률
    const thisMonthAttendance = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
      WHERE academyId = ?
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).bind(parseInt(academyId)).first();

    const attendanceRate = thisMonthAttendance?.total > 0
      ? ((thisMonthAttendance.present / thisMonthAttendance.total) * 100).toFixed(1)
      : 0;

    // 6. 최근 학생 (5명)
    const recentStudents = await DB.prepare(`
      SELECT id, name, email, createdAt
      FROM users
      WHERE role = 'STUDENT' AND academyId = ?
      ORDER BY createdAt DESC
      LIMIT 5
    `).bind(parseInt(academyId)).all();

    // 7. 이번 주 신규 학생 수
    const thisWeekStudents = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT' 
        AND academyId = ?
        AND date(createdAt) >= date('now', '-7 days')
    `).bind(parseInt(academyId)).first();

    // 8. 숙제 통계 (오늘 제출, 기한 지난 미제출만 포함)
    const homeworkStats = await DB.prepare(`
      SELECT 
        COUNT(DISTINCT h.id) as totalHomework,
        COUNT(DISTINCT CASE WHEN hs.status = 'submitted' THEN hs.id END) as submittedCount,
        COUNT(DISTINCT CASE WHEN hs.status = 'graded' THEN hs.id END) as gradedCount,
        COUNT(DISTINCT CASE WHEN h.dueDate >= date('now') THEN h.id END) as activeHomework,
        COUNT(DISTINCT CASE WHEN h.dueDate < date('now') AND (hs.status IS NULL OR hs.status = 'pending') THEN h.id END) as overdueCount
      FROM homework h
      LEFT JOIN homework_submissions hs ON h.id = hs.homeworkId
      WHERE h.academyId = ?
    `).bind(parseInt(academyId)).first();

    // 8-1. 오늘 제출된 숙제 수
    const todaySubmittedHomework = await DB.prepare(`
      SELECT COUNT(DISTINCT hs.id) as count
      FROM homework_submissions hs
      JOIN homework h ON hs.homeworkId = h.id
      WHERE h.academyId = ?
        AND date(hs.submittedAt) = date('now')
        AND hs.status IN ('submitted', 'graded')
    `).bind(parseInt(academyId)).first();

    // 9. 이번 주 숙제 제출률
    const thisWeekHomework = await DB.prepare(`
      SELECT 
        COUNT(DISTINCT h.id) as total,
        COUNT(DISTINCT CASE WHEN hs.status IN ('submitted', 'graded') THEN hs.id END) as submitted
      FROM homework h
      LEFT JOIN homework_submissions hs ON h.id = hs.homeworkId
      WHERE h.academyId = ?
        AND date(h.createdAt) >= date('now', '-7 days')
    `).bind(parseInt(academyId)).first();

    const homeworkSubmissionRate = thisWeekHomework?.total > 0
      ? ((thisWeekHomework.submitted / thisWeekHomework.total) * 100).toFixed(1)
      : 0;

    // 10. AI 챗봇 사용 통계
    const aiBotsStats = await DB.prepare(`
      SELECT 
        COUNT(*) as totalBots,
        SUM(conversationCount) as totalConversations,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeBots
      FROM ai_bots
    `).first();

    // 11. 오늘 AI 대화 수
    const todayAIConversations = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_chat_history
      WHERE date(createdAt) = date('now')
    `).first();

    const stats = {
      totalStudents: studentsCount?.count || 0,
      totalTeachers: teachersCount?.count || 0,
      totalClasses: classesCount?.count || 0,
      todayStats: {
        attendance: todayAttendance?.count || 0,
      },
      attendanceRate: parseFloat(attendanceRate as string),
      recentStudents: recentStudents.results || [],
      thisWeekStudents: thisWeekStudents?.count || 0,
      totalHomework: homeworkStats?.totalHomework || 0,
      submittedHomework: homeworkStats?.submittedCount || 0,
      todaySubmittedHomework: todaySubmittedHomework?.count || 0,
      gradedHomework: homeworkStats?.gradedCount || 0,
      activeHomework: homeworkStats?.activeHomework || 0,
      overdueHomework: homeworkStats?.overdueCount || 0,
      homeworkSubmissionRate: parseFloat(homeworkSubmissionRate as string),
      totalAIBots: aiBotsStats?.totalBots || 0,
      activeAIBots: aiBotsStats?.activeBots || 0,
      totalAIConversations: aiBotsStats?.totalConversations || 0,
      todayAIConversations: todayAIConversations?.count || 0,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Director stats error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch director stats",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
