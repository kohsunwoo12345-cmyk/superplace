interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get all academies with student count
    const result = await DB.prepare(`
      SELECT 
        a.id,
        a.name,
        a.address,
        a.phone,
        a.createdAt,
        COUNT(DISTINCT u.id) as studentCount
      FROM academies a
      LEFT JOIN users u ON u.academyId = a.id AND UPPER(u.role) = 'STUDENT'
      GROUP BY a.id, a.name, a.address, a.phone, a.createdAt
      ORDER BY a.name
    `).all();

    const academies = (result.results || []).map((academy: any) => ({
      id: academy.id,
      name: academy.name,
      address: academy.address || "",
      phone: academy.phone || "",
      studentCount: academy.studentCount || 0,
      createdAt: academy.createdAt,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        academies,
        total: academies.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Academies fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "학원 목록 조회 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
