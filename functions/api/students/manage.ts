import { getUserFromAuth } from '../../_lib/auth';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/manage
 * 역할별 학생 목록 조회 (RBAC 적용 - JWT 토큰 기반)
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

    // 🔒 보안 강화: Authorization 헤더에서 사용자 정보 추출
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      console.error('❌ manage: Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다",
          students: []
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const role = userPayload.role?.toUpperCase();
    const tokenAcademyId = userPayload.academyId;
    const userId = userPayload.id;
    const userEmail = userPayload.email;

    console.log('👥 manage API - Authenticated user:', { userId, role, academyId: tokenAcademyId, email: userEmail });

    const upperRole = role;
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
    // DIRECTOR: 자신의 학원 학생만 조회 (토큰의 academyId 사용)
    else if (upperRole === 'DIRECTOR') {
      console.log('🏫 Director access - fetching academy students from token');
      
      if (!tokenAcademyId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Academy ID not found in token",
            message: "학원 정보가 없습니다",
            students: []
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const academyIdNum = Math.floor(parseFloat(tokenAcademyId));
      
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
