interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 전체 사용자 수
    const totalUsersResult = await DB.prepare(
      "SELECT COUNT(*) as count FROM users"
    ).first<{ count: number }>();
    const totalUsers = totalUsersResult?.count || 0;

    // 이번 달 신규 사용자
    const newUsersResult = await DB.prepare(
      `SELECT COUNT(*) as count FROM users 
       WHERE datetime(created_at) >= datetime('now', 'start of month')`
    ).first<{ count: number }>();
    const newUsersThisMonth = newUsersResult?.count || 0;

    // 역할별 사용자 수
    const usersByRole = await DB.prepare(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    ).all();
    
    const usersByRoleMap: Record<string, number> = {};
    usersByRole?.results?.forEach((row: any) => {
      usersByRoleMap[row.role] = row.count;
    });

    // 학원 수
    const totalAcademiesResult = await DB.prepare(
      "SELECT COUNT(DISTINCT academy_id) as count FROM users WHERE academy_id IS NOT NULL"
    ).first<{ count: number }>();
    const totalAcademies = totalAcademiesResult?.count || 0;

    // 활성 학원 수 (전체 학원 수와 동일하게 처리)
    const activeAcademies = totalAcademies;

    // 학원당 평균 학생 수
    const avgStudentsResult = await DB.prepare(
      `SELECT AVG(student_count) as avg FROM (
        SELECT academy_id, COUNT(*) as student_count 
        FROM users 
        WHERE role = 'STUDENT' AND academy_id IS NOT NULL 
        GROUP BY academy_id
      )`
    ).first<{ avg: number }>();
    const averageStudentsPerAcademy = Math.round(avgStudentsResult?.avg || 0);

    // 최근 가입 사용자 (최근 10명)
    const recentUsers = await DB.prepare(
      `SELECT id, email, name, role, academy_id, created_at 
       FROM users 
       ORDER BY datetime(created_at) DESC 
       LIMIT 10`
    ).all();

    // 임시 데이터 (D1에 AI 봇 테이블이 없을 수 있으므로)
    const stats = {
      totalUsers,
      newUsersThisMonth,
      usersByRole: usersByRoleMap,
      totalAcademies,
      activeAcademies,
      averageStudentsPerAcademy,
      totalBots: 0, // TODO: AI 봇 테이블 생성 후 구현
      activeBots: 0,
      conversationsThisMonth: 0,
      totalInquiries: 0, // TODO: 문의 테이블 생성 후 구현
      pendingInquiries: 0,
      resolvedInquiries: 0,
      recentUsers: recentUsers?.results || [],
      recentInquiries: [], // TODO: 문의 테이블 생성 후 구현
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
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
