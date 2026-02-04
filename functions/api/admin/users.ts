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

    // 모든 사용자 조회 (academy 정보 포함)
    const usersResult = await DB.prepare(
      `SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.phone, 
        u.role, 
        u.academyId,
        u.createdAt,
        u.lastLoginAt
       FROM users u
       ORDER BY datetime(u.createdAt) DESC`
    ).all();

    const users = usersResult?.results || [];

    // 각 사용자의 academy 이름 조회 (academyId가 있는 경우)
    const usersWithAcademy = await Promise.all(
      users.map(async (user: any) => {
        if (user.academyId) {
          // academyId로 학원장 정보 찾기
          const academyOwner = await DB.prepare(
            `SELECT name FROM users WHERE id = ? AND role = 'DIRECTOR' LIMIT 1`
          ).bind(user.academyId).first();
          
          return {
            ...user,
            academyName: academyOwner?.name ? `${academyOwner.name}의 학원` : null,
          };
        }
        return { ...user, academyName: null };
      })
    );

    return new Response(JSON.stringify({ users: usersWithAcademy }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Users list error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch users",
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
