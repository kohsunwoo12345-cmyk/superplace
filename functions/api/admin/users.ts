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

    // academyId 파라미터 가져오기
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");

    console.log("👥 Users API called with academyId:", academyId);

    // 쿼리 작성
    let query = `
      SELECT 
        id, 
        email, 
        name, 
        phone, 
        role, 
        academyId,
        createdAt
      FROM users
    `;
    
    const params: any[] = [];
    
    // academyId로 필터링 (문자열과 정수 모두 비교)
    if (academyId) {
      query += ` WHERE (CAST(academyId AS TEXT) = ? OR academyId = ?)`;
      params.push(String(academyId), parseInt(academyId));
      console.log("🔍 Filtering users by academyId:", academyId, "(both string and int)");
    } else {
      console.warn("⚠️ No academyId provided to users API!");
    }
    
    query += ` ORDER BY datetime(createdAt) DESC`;

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
