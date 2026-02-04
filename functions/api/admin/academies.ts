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

    // academyId로 그룹화하여 학원 정보 조회
    const academiesQuery = await DB.prepare(
      `SELECT DISTINCT academyId FROM users WHERE academyId IS NOT NULL AND role IN ('STUDENT', 'TEACHER', 'DIRECTOR')`
    ).all();

    const academyIds = academiesQuery?.results?.map((row: any) => row.academyId) || [];

    // 각 학원의 상세 정보 조회
    const academies = await Promise.all(
      academyIds.map(async (academyId: string) => {
        // 학원장 정보
        const director = await DB.prepare(
          `SELECT id, name, email, phone, createdAt FROM users WHERE id = ? AND role = 'DIRECTOR' LIMIT 1`
        ).bind(academyId).first();

        if (!director) {
          return null;
        }

        // 해당 학원의 학생 수
        const studentCount = await DB.prepare(
          `SELECT COUNT(*) as count FROM users WHERE academyId = ? AND role = 'STUDENT'`
        ).bind(academyId).first<{ count: number }>();

        // 해당 학원의 선생님 수
        const teacherCount = await DB.prepare(
          `SELECT COUNT(*) as count FROM users WHERE academyId = ? AND role = 'TEACHER'`
        ).bind(academyId).first<{ count: number }>();

        // 최근 활동 확인
        const recentActivity = await DB.prepare(
          `SELECT MAX(datetime(lastLoginAt)) as lastActivity FROM users WHERE academyId = ?`
        ).bind(academyId).first<{ lastActivity: string }>();

        const lastActivityDate = recentActivity?.lastActivity ? new Date(recentActivity.lastActivity) : null;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isActive = lastActivityDate ? lastActivityDate > thirtyDaysAgo : false;

        return {
          id: academyId,
          name: `${director.name}의 학원`,
          address: null, // TODO: 학원 테이블 생성 시 추가
          phone: director.phone,
          email: director.email,
          directorName: director.name,
          studentCount: studentCount?.count || 0,
          teacherCount: teacherCount?.count || 0,
          isActive,
          createdAt: director.createdAt,
        };
      })
    );

    // null 제거
    const validAcademies = academies.filter(a => a !== null);

    return new Response(JSON.stringify({ academies: validAcademies }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Academies list error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch academies",
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
