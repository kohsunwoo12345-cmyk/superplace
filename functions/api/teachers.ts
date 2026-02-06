interface Env {
  DB: D1Database;
}

// 선생님 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');

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
        academyId,
        createdAt,
        lastLoginAt
      FROM users
      WHERE role = 'TEACHER'
    `;

    const params: any[] = [];

    if (academyId) {
      query += ` AND academyId = ?`;
      params.push(parseInt(academyId));
    }

    query += ` ORDER BY createdAt DESC`;

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
