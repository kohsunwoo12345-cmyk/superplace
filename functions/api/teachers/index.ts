interface Env {
  DB: D1Database;
}

/**
 * GET /api/teachers?role={role}&academyId={academyId}
 * 교사 목록 조회 (RBAC 적용)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const role = url.searchParams.get("role");
    const academyId = url.searchParams.get("academyId");

    console.log('👨‍🏫 Get teachers request:', { role, academyId });

    const upperRole = role?.toUpperCase();

    let query = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        academy_id as academyId,
        created_at as createdAt
      FROM users
      WHERE UPPER(role) = 'TEACHER'
    `;

    const bindings: any[] = [];

    // ADMIN/SUPER_ADMIN: 모든 교사 조회
    if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
      console.log('🔑 Admin access - fetching all teachers');
      // academyId가 있으면 필터링
      if (academyId) {
        const academyIdNum = parseInt(academyId, 10);
        query += ` AND academy_id = ?`;
        bindings.push(academyIdNum);
      }
    } 
    // DIRECTOR: 자신의 학원 교사만
    else if (upperRole === 'DIRECTOR') {
      console.log('🏫 Director access - fetching academy teachers');
      
      if (!academyId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "academyId is required for directors",
            teachers: []
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      const academyIdNum = parseInt(academyId, 10);
      query += ` AND academy_id = ?`;
      bindings.push(academyIdNum);
    }
    // 그 외 역할은 접근 불가
    else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized access",
          teachers: []
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    query += ` ORDER BY created_at DESC`;

    console.log('📊 Query:', query, bindings);
    const result = await DB.prepare(query).bind(...bindings).all();
    
    const teachers = result.results || [];
    
    console.log('✅ Teachers found:', teachers.length);

    return new Response(
      JSON.stringify({
        success: true,
        teachers: teachers,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Get teachers error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get teachers",
        message: error.message,
        teachers: []
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
