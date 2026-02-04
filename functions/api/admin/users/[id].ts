interface Env {
  DB: D1Database;
}

// 사용자 상세 정보 조회 (비밀번호 포함)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 사용자 정보 조회 (비밀번호 포함)
    const user = await DB.prepare(
      `SELECT 
        id, email, name, phone, role, password, 
        academyId, createdAt, lastLoginAt, lastLoginIp
       FROM users 
       WHERE id = ?`
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // academyName 조회
    let academyName = null;
    if (user.academyId) {
      const academyOwner = await DB.prepare(
        `SELECT name FROM users WHERE id = ? AND role = 'DIRECTOR' LIMIT 1`
      ).bind(user.academyId).first();
      
      if (academyOwner) {
        academyName = `${academyOwner.name}의 학원`;
      }
    }

    return new Response(
      JSON.stringify({
        user: {
          ...user,
          academyName,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("User detail error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch user detail",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
