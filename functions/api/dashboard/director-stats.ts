interface Env {
  DB: D1Database;
}

// 원장/교사 대시보드 통계
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyIdParam = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');
    const userId = url.searchParams.get('userId');

    console.log('📊 Director stats - academyId:', academyIdParam, 'role:', role, 'userId:', userId);

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!academyIdParam) {
      return new Response(JSON.stringify({ error: "Academy ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const academyId = parseInt(academyIdParam);

    // 1. 학원의 전체 학생 수
    const studentsCount = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'STUDENT' AND academy_id = ?
    `).bind(academyId).first();

    console.log('✅ Total students:', studentsCount?.count);

    // 2. 학원의 선생님 수
    const teachersCount = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'TEACHER' AND academy_id = ?
    `).bind(academyId).first();

    console.log('✅ Total teachers:', teachersCount?.count);

    // 3. 오늘 출석 학생 수
    const todayAttendance = await DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM attendance
      WHERE academy_id = ?
        AND DATE(checked_at) = DATE('now')
        AND status = 'present'
    `).bind(academyId).first();

    console.log('✅ Today attendance:', todayAttendance?.count);

    // 4. 오늘 숙제 제출 수
    const todayHomeworkSubmitted = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM homework_submissions
      WHERE academy_id = ?
        AND DATE(submitted_at) = DATE('now')
    `).bind(academyId).first();

    console.log('✅ Today homework submitted:', todayHomeworkSubmitted?.count);

    // 5. 오늘 출석했지만 숙제 미제출 학생 수
    const todayMissingHomework = await DB.prepare(`
      SELECT COUNT(DISTINCT a.user_id) as count
      FROM attendance a
      LEFT JOIN homework_submissions hs 
        ON a.user_id = hs.user_id 
        AND DATE(hs.submitted_at) = DATE('now')
      WHERE a.academy_id = ?
        AND DATE(a.checked_at) = DATE('now')
        AND a.status = 'present'
        AND hs.id IS NULL
    `).bind(academyId).first();

    console.log('✅ Today missing homework:', todayMissingHomework?.count);

    // 6. 출석률 계산
    const totalStudents = studentsCount?.count || 0;
    const attendanceCount = todayAttendance?.count || 0;
    const attendanceRate = totalStudents > 0 
      ? Math.round((attendanceCount / totalStudents) * 100)
      : 0;

    // 7. 오늘 출석 알림 목록 (최근 5명)
    const attendanceAlerts = await DB.prepare(`
      SELECT 
        a.user_id as userId,
        u.name as studentName,
        a.checked_at as time,
        CASE 
          WHEN hs.id IS NOT NULL THEN 1
          ELSE 0
        END as homeworkSubmitted
      FROM attendance a
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN homework_submissions hs 
        ON a.user_id = hs.user_id 
        AND DATE(hs.submitted_at) = DATE('now')
      WHERE a.academy_id = ?
        AND DATE(a.checked_at) = DATE('now')
        AND a.status = 'present'
      ORDER BY a.checked_at DESC
      LIMIT 5
    `).bind(academyId).all();

    console.log('✅ Attendance alerts:', attendanceAlerts.results?.length);

    // 8. 숙제 검사 결과 (최근 5개)
    const homeworkResults = await DB.prepare(`
      SELECT 
        u.name as studentName,
        hs.score as score,
        hs.subject as subject,
        '완성' as completion,
        '우수' as effort,
        hs.submitted_at as submittedAt
      FROM homework_submissions hs
      INNER JOIN users u ON hs.user_id = u.id
      WHERE hs.academy_id = ?
        AND DATE(hs.submitted_at) = DATE('now')
        AND hs.score IS NOT NULL
      ORDER BY hs.submitted_at DESC
      LIMIT 5
    `).bind(academyId).all();

    console.log('✅ Homework results:', homeworkResults.results?.length);

    // 9. 숙제 미제출 학생 목록 (최근 5명)
    const missingHomeworkList = await DB.prepare(`
      SELECT 
        u.id as userId,
        u.name as studentName,
        a.checked_at as attendedAt
      FROM attendance a
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN homework_submissions hs 
        ON a.user_id = hs.user_id 
        AND DATE(hs.submitted_at) = DATE('now')
      WHERE a.academy_id = ?
        AND DATE(a.checked_at) = DATE('now')
        AND a.status = 'present'
        AND hs.id IS NULL
      ORDER BY a.checked_at DESC
      LIMIT 5
    `).bind(academyId).all();

    console.log('✅ Missing homework list:', missingHomeworkList.results?.length);

    const stats = {
      totalStudents: studentsCount?.count || 0,
      totalTeachers: teachersCount?.count || 0,
      attendanceRate: attendanceRate,
      todayStats: {
        attendance: todayAttendance?.count || 0,
        homeworkSubmitted: todayHomeworkSubmitted?.count || 0,
        missingHomework: todayMissingHomework?.count || 0,
      },
      attendanceAlerts: (attendanceAlerts.results || []).map((alert: any) => ({
        studentName: alert.studentName,
        time: alert.time,
        homeworkSubmitted: alert.homeworkSubmitted === 1,
      })),
      homeworkResults: (homeworkResults.results || []).map((result: any) => ({
        studentName: result.studentName,
        score: result.score || 0,
        subject: result.subject || '일반',
        completion: result.completion || '완성',
        effort: result.effort || '우수',
      })),
      missingHomeworkList: (missingHomeworkList.results || []).map((missing: any) => ({
        studentName: missing.studentName,
        attendedAt: missing.attendedAt,
      })),
    };

    console.log('📊 Final stats:', JSON.stringify(stats, null, 2));

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Director stats error:", error);
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
