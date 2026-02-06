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

    // 모든 사용자 조회 (컬럼 존재 여부 확인 후 조회)
    let usersResult;
    try {
      // attendance_code 컬럼이 있는 경우
      let query = `SELECT 
          u.id, 
          u.email, 
          u.name, 
          u.phone, 
          u.role, 
          u.academy_id as academyId,
          u.academy_name as academyName,
          u.attendance_code as attendanceCode,
          u.created_at as createdAt
         FROM users u`;
      
      const params: any[] = [];
      
      // academyId로 필터링
      if (academyId) {
        query += ` WHERE u.academy_id = ?`;
        params.push(parseInt(academyId));
      }
      
      query += ` ORDER BY datetime(u.created_at) DESC`;
      
      if (params.length > 0) {
        usersResult = await DB.prepare(query).bind(...params).all();
      } else {
        usersResult = await DB.prepare(query).all();
      }
    } catch (err: any) {
      // attendance_code 컬럼이 없는 경우
      if (err.message && err.message.includes('attendance_code')) {
        let query = `SELECT 
            u.id, 
            u.email, 
            u.name, 
            u.phone, 
            u.role, 
            u.academy_id as academyId,
            u.academy_name as academyName,
            u.created_at as createdAt
           FROM users u`;
        
        const params: any[] = [];
        
        // academyId로 필터링
        if (academyId) {
          query += ` WHERE u.academy_id = ?`;
          params.push(parseInt(academyId));
        }
        
        query += ` ORDER BY datetime(u.created_at) DESC`;
        
        if (params.length > 0) {
          usersResult = await DB.prepare(query).bind(...params).all();
        } else {
          usersResult = await DB.prepare(query).all();
        }
      } else {
        throw err;
      }
    }

    const users = usersResult?.results || [];

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Users list error:", error);
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
