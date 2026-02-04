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

    // 모든 사용자 조회 (실제 DB 컬럼명 사용)
    const usersResult = await DB.prepare(
      `SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.phone, 
        u.role, 
        u.academy_id as academyId,
        u.academy_name as academyName,
        u.created_at as createdAt
       FROM users u
       ORDER BY datetime(u.created_at) DESC`
    ).all();

    let users = usersResult?.results || [];

    // 학생의 경우 출석 코드 조회
    try {
      const usersWithCodes = await Promise.all(
        users.map(async (user: any) => {
          if (user.role?.toUpperCase() === 'STUDENT') {
            try {
              const codeResult = await DB.prepare(
                `SELECT code FROM student_attendance_codes 
                 WHERE userId = ? AND isActive = 1 
                 ORDER BY createdAt DESC LIMIT 1`
              ).bind(user.id).first();
              
              return {
                ...user,
                attendanceCode: codeResult?.code || null
              };
            } catch (e) {
              return user;
            }
          }
          return user;
        })
      );
      users = usersWithCodes;
    } catch (e) {
      console.error('Failed to fetch attendance codes:', e);
    }

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
