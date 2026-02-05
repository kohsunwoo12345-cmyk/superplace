interface Env {
  DB: D1Database;
}

// 학생 목록 조회 (학원별 필터링 지원)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let query = `
      SELECT 
        id,
        email,
        name,
        phone,
        role,
        academy_id as academyId,
        academy_name as academyName,
        datetime(created_at) as createdAt,
        datetime(lastLoginAt) as lastLoginAt,
        points,
        balance
      FROM users
      WHERE role = 'STUDENT'
    `;

    const params: any[] = [];

    // 관리자가 아닌 경우 학원 필터링
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && academyId) {
      query += ` AND academy_id = ?`;
      params.push(academyId);
    }

    query += ` ORDER BY datetime(created_at) DESC`;

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        students: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch students error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch students",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
