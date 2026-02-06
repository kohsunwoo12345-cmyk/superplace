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

    // 파라미터 가져오기
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");
    const role = url.searchParams.get("role");

    console.log("👥 Users API called with:", { academyId, role });

    const isGlobalAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    // 쿼리 작성
    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.phone, 
        u.role, 
        u.academyId,
        a.name as academyName,
        u.createdAt
      FROM users u
      LEFT JOIN academy a ON CAST(u.academyId AS TEXT) = CAST(a.id AS TEXT)
    `;
    
    const params: any[] = [];
    
    // 관리자가 아닌 경우에만 academyId로 필터링
    if (!isGlobalAdmin && academyId) {
      query += ` WHERE (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      params.push(String(academyId), parseInt(academyId));
      console.log("🔍 Filtering users by academyId:", academyId, "for DIRECTOR");
    } else if (isGlobalAdmin) {
      console.log("✅ Global admin - showing all users");
    }
    
    query += ` ORDER BY datetime(u.createdAt) DESC`;

    // 쿼리 실행
    let usersResult;
    if (params.length > 0) {
      usersResult = await DB.prepare(query).bind(...params).all();
    } else {
      usersResult = await DB.prepare(query).all();
    }

    const users = usersResult?.results || [];
    
    console.log("✅ Users fetched:", users.length, "users");

    return new Response(JSON.stringify({ success: true, users }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Users list error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
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
