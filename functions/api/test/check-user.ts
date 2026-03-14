interface Env {
  DB: D1Database;
}

/**
 * 사용자 조회 디버깅 API
 * GET /api/test/check-user?userId=247&table=User
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const table = url.searchParams.get('table') || 'User';

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 사용자 조회: userId=${userId}, table=${table}`);

    // 사용자 조회
    let query: string;
    if (table === 'users') {
      query = "SELECT id, name, email, academy_id as academyId, role FROM users WHERE id = ?";
    } else {
      query = "SELECT id, name, email, academyId, role FROM users WHERE id = ?";
    }

    const user = await DB.prepare(query).bind(userId).first();

    if (!user) {
      console.log(`❌ ${table} 테이블에서 찾을 수 없음`);
      return new Response(
        JSON.stringify({
          found: false,
          table,
          userId,
          message: `User not found in ${table} table`
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 사용자 발견: ${user.name}`);

    return new Response(
      JSON.stringify({
        found: true,
        table,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          academyId: user.academyId,
          role: user.role
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 오류:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check user",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
