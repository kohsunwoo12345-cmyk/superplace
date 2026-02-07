interface Env {
  DB: D1Database;
}

// 관리자 대시보드 통계
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. 전체 학원 수
    const academiesCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM academy WHERE isActive = 1
    `).first();

    // 2. 전체 학생 수
    const studentsCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'
    `).first();

    // 3. 전체 선생님 수
    const teachersCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'TEACHER'
    `).first();

    // 4. 이번 달 매출
    const thisMonthRevenue = await DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM revenue_records
      WHERE status = 'completed'
        AND strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')
    `).first();

    // 5. 전체 매출
    const totalRevenue = await DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM revenue_records
      WHERE status = 'completed'
    `).first();

    // 6. 대기 중인 결제 승인 수
    const pendingPayments = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM payment_approvals
      WHERE status = 'pending'
    `).first();

    // 7. 최근 가입 학원 (5개)
    const recentAcademies = await DB.prepare(`
      SELECT id, name, directorName, createdAt
      FROM academy
      WHERE isActive = 1
      ORDER BY createdAt DESC
      LIMIT 5
    `).all();

    // 8. 이번 주/지난 주 비교 통계
    const thisWeekStudents = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
        AND date(createdAt) >= date('now', '-7 days')
    `).first();

    const lastWeekStudents = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
        AND date(createdAt) >= date('now', '-14 days')
        AND date(createdAt) < date('now', '-7 days')
    `).first();

    const studentGrowth = lastWeekStudents?.count > 0 
      ? ((thisWeekStudents?.count - lastWeekStudents?.count) / lastWeekStudents?.count * 100).toFixed(1)
      : thisWeekStudents?.count > 0 ? 100 : 0;

    const stats = {
      totalAcademies: academiesCount?.count || 0,
      totalStudents: studentsCount?.count || 0,
      totalTeachers: teachersCount?.count || 0,
      thisMonthRevenue: thisMonthRevenue?.total || 0,
      totalRevenue: totalRevenue?.total || 0,
      pendingPayments: pendingPayments?.count || 0,
      recentAcademies: recentAcademies.results || [],
      studentGrowth: studentGrowth,
      thisWeekStudents: thisWeekStudents?.count || 0,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch dashboard stats",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
