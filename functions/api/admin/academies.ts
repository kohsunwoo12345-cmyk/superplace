// API: 학원 목록 조회
// GET /api/admin/academies

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 모든 학원 조회
    const result = await db
      .prepare(`
        SELECT 
          id,
          name,
          code,
          description,
          address,
          phone,
          email,
          subscriptionPlan,
          isActive,
          createdAt
        FROM academy
        WHERE isActive = 1
        ORDER BY name ASC
      `)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        academies: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("학원 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "학원 목록 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
