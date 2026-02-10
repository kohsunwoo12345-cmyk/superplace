interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/manage
 * 역할별 학생 목록 조회 (RBAC 적용)
 * - ADMIN/SUPER_ADMIN: 모든 학생 조회
 * - DIRECTOR: 자신의 학원 학생만 조회
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
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const academyId = url.searchParams.get("academyId");

    console.log('👥 Get students manage API:', { userId, role, academyId });

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "userId and role are required",
          students: []
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const upperRole = role.toUpperCase();
    let students: any[] = [];

    // ADMIN/SUPER_ADMIN: 모든 학생 조회
    if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
      console.log('🔑 Admin access - fetching all students');
      
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.academy_id,
          u.role,
          u.created_at,
          a.name as academy_name
        FROM users u
        LEFT JOIN academies a ON u.academy_id = a.id
        WHERE u.role = 'STUDENT'
      `;

      const bindings: any[] = [];

      // academyId 필터 (선택적)
      if (academyId) {
        const academyIdNum = parseFloat(academyId);
        if (!isNaN(academyIdNum)) {
          query += ` AND u.academy_id = ?`;
          bindings.push(Math.floor(academyIdNum));
        }
      }

      query += ` ORDER BY u.created_at DESC`;

      console.log('📊 Admin query:', query, bindings);
      const result = await DB.prepare(query).bind(...bindings).all();
      students = result.results || [];
      console.log('✅ Admin students found:', students.length);
    }
    // DIRECTOR: 자신의 학원 학생만 조회
    else if (upperRole === 'DIRECTOR') {
      console.log('🏫 Director access - fetching academy students');
      
      if (!academyId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "academyId is required for directors",
            students: []
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const academyIdNum = Math.floor(parseFloat(academyId));
      
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.academy_id,
          u.role,
          u.created_at,
          a.name as academy_name
        FROM users u
        LEFT JOIN academies a ON u.academy_id = a.id
        WHERE u.role = 'STUDENT' AND u.academy_id = ?
        ORDER BY u.created_at DESC
      `;

      console.log('📊 Director query:', query, [academyIdNum]);
      const result = await DB.prepare(query).bind(academyIdNum).all();
      students = result.results || [];
      console.log('✅ Director students found:', students.length);
    }
    // 기타 역할: 접근 불가
    else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized access",
          students: []
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Final students count:', students.length);

    return new Response(
      JSON.stringify({
        success: true,
        students: students,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Get students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get students",
        message: error.message,
        students: []
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
