interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 전체 사용자 수
    const totalUsersResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();
    const totalUsers = totalUsersResult?.count || 0;

    // 이번 달 신규 가입자
    const newUsersResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE substr(created_at, 1, 7) = substr(datetime('now', '+9 hours'), 1, 7)
    `).first();
    const newUsersThisMonth = newUsersResult?.count || 0;

    // 역할별 사용자 수
    const usersByRole = await DB.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all();
    
    const roleStats: any = {};
    usersByRole.results.forEach((row: any) => {
      roleStats[row.role] = row.count;
    });

    // 전체 학생 수
    const totalStudents = roleStats.STUDENT || 0;

    // 최근 가입 사용자 (7일)
    const recentUsers = await DB.prepare(`
      SELECT 
        id,
        name,
        email,
        role,
        academy_name as academy,
        created_at as createdAt
      FROM users
      WHERE datetime(created_at) >= datetime('now', '-7 days', '+9 hours')
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    // 최근 출석 기록
    const recentAttendance = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM attendance_records
      WHERE substr(verifiedAt, 1, 10) = substr(datetime('now', '+9 hours'), 1, 10)
    `).first();
    const todayAttendance = recentAttendance?.count || 0;

    // 최근 숙제 제출
    const recentHomework = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM homework_submissions
      WHERE substr(submittedAt, 1, 10) = substr(datetime('now', '+9 hours'), 1, 10)
    `).first();
    const todayHomework = recentHomework?.count || 0;

    // 전체 구매 통계 (준비 중)
    const totalPurchases = 0;
    const totalRevenue = 0;

    return new Response(
      JSON.stringify({
        success: true,
        totalUsers,
        newUsersThisMonth,
        usersByRole: roleStats,
        totalStudents,
        recentUsers: recentUsers.results,
        todayAttendance,
        todayHomework,
        totalPurchases,
        totalRevenue,
        activeAcademies: 0,
        totalAcademies: 0,
        aiUsageThisMonth: 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Admin dashboard stats error:", error);
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
