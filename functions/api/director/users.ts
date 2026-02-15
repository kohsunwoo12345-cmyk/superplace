interface Env {
  DB: D1Database;
}

// 학원장용 사용자 목록 조회 (학생/교사) - 자신의 학원 소속만
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const role = url.searchParams.get('role') || 'STUDENT';
    const academyId = url.searchParams.get('academyId'); // 학원장의 academy_id

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!academyId) {
      return new Response(
        JSON.stringify({ error: "academyId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📋 Fetching ${role} users for academy ${academyId}`);

    // 학원장의 학원에 소속된 사용자만 조회
    const users = await DB.prepare(`
      SELECT 
        id,
        name,
        email,
        role,
        academy_id as academyId
      FROM users
      WHERE role = ? AND academy_id = ?
      ORDER BY name ASC
    `).bind(role.toUpperCase(), parseInt(academyId)).all();

    console.log(`✅ Found ${users.results?.length || 0} users`);

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
