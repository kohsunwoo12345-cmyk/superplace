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

    // 4. 이번 달 출석률
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

    // 5. 최근 학생 (5명)
    const recentStudents = await DB.prepare(`
      SELECT id, name, email, createdAt
      FROM users
      WHERE role = 'STUDENT' AND academyId = ?
      ORDER BY createdAt DESC
      LIMIT 5
    `).bind(parseInt(academyId)).all();

    // 6. 이번 주 신규 학생 수
    const thisWeekStudents = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT' 
        AND academyId = ?
        AND date(createdAt) >= date('now', '-7 days')
    `).bind(parseInt(academyId)).first();

    const stats = {
      totalStudents: studentsCount?.count || 0,
      totalTeachers: teachersCount?.count || 0,
      totalClasses: classesCount?.count || 0,
      attendanceRate: parseFloat(attendanceRate as string),
      recentStudents: recentStudents.results || [],
      thisWeekStudents: thisWeekStudents?.count || 0,
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
