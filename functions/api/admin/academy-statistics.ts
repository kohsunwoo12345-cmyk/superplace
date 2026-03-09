// API: 학원별 통계 데이터 조회
// GET /api/admin/academy-statistics

interface Env {
  DB: D1Database;
}

function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "DB 연결 실패" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 인증 확인
    const authHeader = context.request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "권한이 없습니다" 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('📊 학원별 통계 데이터 조회 시작');

    // 1. 모든 학원 목록 조회
    const academiesResult = await db.prepare(`
      SELECT 
        a.id,
        a.name,
        a.contact_number,
        a.email,
        a.address,
        a.created_at,
        u.name as director_name,
        u.email as director_email
      FROM academy a
      LEFT JOIN users u ON a.id = u.academyId AND u.role = 'DIRECTOR'
      WHERE a.isActive = 1
      ORDER BY a.created_at DESC
    `).all();

    const academies = academiesResult.results || [];
    console.log(`✅ 학원 ${academies.length}개 조회됨`);

    // 2. 각 학원별 통계 수집
    const statistics = [];

    for (const academy of academies) {
      const academyId = academy.id;
      
      // 2.1 전체 학생 수
      const studentCountResult = await db.prepare(`
        SELECT COUNT(*) as total
        FROM users
        WHERE academyId = ? AND role = 'STUDENT' AND isActive = 1
      `).bind(academyId).first();

      const totalStudents = studentCountResult?.total || 0;

      // 2.2 최근 3개월 월별 신규 학생 수
      const monthlyNewStudents = await db.prepare(`
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as count
        FROM users
        WHERE academyId = ? 
          AND role = 'STUDENT' 
          AND created_at >= datetime('now', '-3 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month DESC
      `).bind(academyId).all();

      // 2.3 이번 달 신규 학생
      const thisMonthNewResult = await db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE academyId = ? 
          AND role = 'STUDENT' 
          AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
      `).bind(academyId).first();

      const thisMonthNew = thisMonthNewResult?.count || 0;

      // 2.4 출석 통계 (최근 30일)
      const attendanceStatsResult = await db.prepare(`
        SELECT 
          COUNT(DISTINCT student_id) as total_checked_students,
          COUNT(*) as total_checkins,
          COUNT(DISTINCT DATE(checkin_time)) as total_days
        FROM attendance_records
        WHERE academy_id = ? 
          AND checkin_time >= datetime('now', '-30 days')
      `).bind(academyId).first();

      const attendanceStats = attendanceStatsResult || {
        total_checked_students: 0,
        total_checkins: 0,
        total_days: 0
      };

      // 출석률 계산 (전체 학생 대비 출석한 학생)
      const attendanceRate = totalStudents > 0 
        ? ((attendanceStats.total_checked_students / totalStudents) * 100).toFixed(1)
        : '0.0';

      // 2.5 숙제 제출 통계 (최근 30일)
      const homeworkStatsResult = await db.prepare(`
        SELECT 
          COUNT(DISTINCT student_id) as students_submitted,
          COUNT(*) as total_submissions,
          AVG(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) * 100 as completion_rate
        FROM homework_submissions
        WHERE academy_id = ? 
          AND submitted_at >= datetime('now', '-30 days')
      `).bind(academyId).first();

      const homeworkStats = homeworkStatsResult || {
        students_submitted: 0,
        total_submissions: 0,
        completion_rate: 0
      };

      // 2.6 숙제 제출률 계산
      const homeworkSubmissionRate = totalStudents > 0
        ? ((homeworkStats.students_submitted / totalStudents) * 100).toFixed(1)
        : '0.0';

      statistics.push({
        academy: {
          id: academy.id,
          name: academy.name,
          directorName: academy.director_name,
          directorEmail: academy.director_email,
          contact: academy.contact_number,
          email: academy.email,
          address: academy.address,
          createdAt: academy.created_at
        },
        students: {
          total: totalStudents,
          thisMonthNew: thisMonthNew,
          monthlyGrowth: monthlyNewStudents.results || []
        },
        attendance: {
          rate: parseFloat(attendanceRate),
          studentsChecked: attendanceStats.total_checked_students,
          totalCheckins: attendanceStats.total_checkins,
          activeDays: attendanceStats.total_days,
          period: '최근 30일'
        },
        homework: {
          submissionRate: parseFloat(homeworkSubmissionRate),
          studentsSubmitted: homeworkStats.students_submitted,
          totalSubmissions: homeworkStats.total_submissions,
          completionRate: parseFloat(homeworkStats.completion_rate || 0).toFixed(1),
          period: '최근 30일'
        }
      });
    }

    console.log(`✅ 총 ${statistics.length}개 학원 통계 생성 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        statistics,
        count: statistics.length,
        generatedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ 학원 통계 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "학원 통계 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
