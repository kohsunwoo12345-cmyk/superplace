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
        academy_id as academyId, 
        academy_name as academyName,
        created_at as createdAt
       FROM users 
       WHERE id = ?`
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ user }),
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
