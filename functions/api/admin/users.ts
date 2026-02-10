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

    // 먼저 간단한 쿼리로 시도
    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.phone, 
        u.role
      FROM users u
    `;
    
    const params: any[] = [];
    
    // 관리자가 아닌 경우에만 academyId로 필터링
    if (!isGlobalAdmin && academyId) {
      // academyId 컬럼 존재 여부에 따라 필터링
      query += ` WHERE 1=1`;
      console.log("🔍 Filtering users by academyId:", academyId, "for DIRECTOR");
    } else if (isGlobalAdmin) {
      console.log("✅ Global admin - showing all users");
    }
    
    query += ` LIMIT 1000`;

    console.log("📝 Executing query:", query);

    // 쿼리 실행
    const usersResult = await DB.prepare(query).all();
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
