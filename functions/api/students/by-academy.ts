interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/by-academy?academyId={academyId}&role={role}
 * 학원별 학생 목록 조회 (RBAC 적용)
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
    const academyId = url.searchParams.get("academyId");
    const role = url.searchParams.get("role");

    console.log('👥 Get students by-academy request:', { academyId, role });

    const upperRole = role?.toUpperCase();
    
    // 실제 D1 스키마 사용 (snake_case)
    let query = `
      SELECT 
        id,
        name,
        email,
        phone,
        academy_id as academyId,
        role
      FROM users
      WHERE role = 'STUDENT'
    `;

    const bindings: any[] = [];

    // ADMIN/SUPER_ADMIN: 모든 학생 조회
    if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
      console.log('🔑 Admin access - fetching all students');
      // academyId가 있으면 필터링, 없으면 모든 학생
      if (academyId) {
        const academyIdNum = Math.floor(parseFloat(academyId));
        query += ` AND academy_id = ?`;
        bindings.push(academyIdNum);
      }
    } 
    // DIRECTOR: 자신의 학원 학생만
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
      query += ` AND academy_id = ?`;
      bindings.push(academyIdNum);
    }
    // 그 외 역할은 접근 불가
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

    query += ` ORDER BY name ASC`;

    console.log('📊 Query:', query, bindings);
    const result = await DB.prepare(query).bind(...bindings).all();
    
    const students = (result.results || []).map((s: any) => ({
      id: s.id.toString(),
      name: s.name,
      email: s.email,
      studentCode: s.id.toString(),
      grade: null,
      phone: s.phone,
      academyId: s.academyId
    }));
    
    console.log('✅ Students found:', students.length);
    console.log('📝 First student:', students[0]);

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
