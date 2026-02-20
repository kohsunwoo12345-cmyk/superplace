import { getUserFromAuth } from '../../_lib/auth';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/by-academy
 * 학원별 학생 목록 조회 (RBAC 적용 - JWT 토큰 기반)
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
      console.error('❌ by-academy: Missing or invalid Authorization header');
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
    const userEmail = userPayload.email;

    console.log('👥 by-academy API - Authenticated user:', { role, academyId: tokenAcademyId, email: userEmail });

    const upperRole = role;
    
    // 실제 D1 스키마 사용 (snake_case) - students 테이블과 users 테이블 JOIN
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.academy_id as academyId,
        u.role,
        s.id as studentId,
        s.student_code as studentCode,
        s.grade,
        s.status
      FROM users u
      INNER JOIN students s ON u.id = s.user_id
      WHERE u.role = 'STUDENT'
    `;

    const bindings: any[] = [];

    // ADMIN/SUPER_ADMIN: 모든 학생 조회
    if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
      console.log('🔑 Admin access - fetching all students');
      // Optional: academyId from query param for filtering
      const url = new URL(context.request.url);
      const requestedAcademyId = url.searchParams.get("academyId");
      if (requestedAcademyId) {
        const academyIdNum = Math.floor(parseFloat(requestedAcademyId));
        query += ` AND u.academy_id = ?`;
        bindings.push(academyIdNum);
      }
    } 
    // DIRECTOR: 자신의 학원 학생만 (토큰의 academyId 사용)
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
      
      query += ` AND u.academy_id = ?`;
      bindings.push(tokenAcademyId);
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

    query += ` ORDER BY u.name ASC`;

    console.log('📊 Query:', query, bindings);
    const result = await DB.prepare(query).bind(...bindings).all();
    
    const students = (result.results || []).map((s: any) => ({
      id: s.id.toString(),
      name: s.name,
      email: s.email,
      studentCode: s.studentCode || s.id.toString(),
      grade: s.grade,
      phone: s.phone,
      academyId: s.academyId,
      status: s.status
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
