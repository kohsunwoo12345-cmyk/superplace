interface Env {
  DB: D1Database;
}

// 학원장용 사용자 목록 조회 (학생/교사)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const role = url.searchParams.get('role') || 'STUDENT';

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: 실제로는 학원장의 학원에 소속된 사용자만 조회해야 함
    // 지금은 모든 사용자 조회
    const users = await DB.prepare(`
      SELECT 
        id,
        name,
        email,
        role,
        academy_id as academyId
      FROM users
      WHERE role = ?
      ORDER BY name ASC
    `).bind(role.toUpperCase()).all();

    return new Response(
      JSON.stringify({
        success: true,
        users: users.results || []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
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
