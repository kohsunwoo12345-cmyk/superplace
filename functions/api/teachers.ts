interface Env {
  DB: D1Database;
}

// 선생님 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');

    console.log('👨‍🏫 Teachers API called with:', { role, academyId });

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isGlobalAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    let query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.academyId,
        a.name as academyName,
        u.createdAt,
        u.lastLoginAt
      FROM users u
      LEFT JOIN academy a ON CAST(u.academyId AS TEXT) = CAST(a.id AS TEXT)
      WHERE u.role = 'TEACHER'
    `;

    const params: any[] = [];

    // 관리자가 아닌 경우에만 academyId 필터링
    if (!isGlobalAdmin && academyId) {
      query += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      params.push(String(academyId), parseInt(academyId));
      console.log('🔍 Filtering by academyId:', academyId, 'for DIRECTOR');
    } else if (isGlobalAdmin) {
      console.log('✅ Global admin - showing all teachers');
    }

    query += ` ORDER BY u.createdAt DESC`;

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        teachers: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch teachers error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch teachers",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
