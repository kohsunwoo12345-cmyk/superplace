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

    const userId = userPayload.userId || userPayload.id;
    const role = userPayload.role?.toUpperCase();
    let tokenAcademyId = userPayload.academyId;
    const userEmail = userPayload.email;

    console.log('👥 by-academy API - Token payload:', { userId, role, academyId: tokenAcademyId, email: userEmail });
    
    // 🔍 토큰에 academyId가 없으면 DB에서 조회
    if (!tokenAcademyId && userId) {
      console.log('🔍 academyId not in token, fetching from DB for user:', userId);
      try {
        const userRecord = await DB.prepare(`
          SELECT id, academy_id, role 
          FROM users 
          WHERE id = ?
        `).bind(userId).first();
        
        if (userRecord) {
          tokenAcademyId = userRecord.academy_id || userRecord.id; // fallback to user id
          console.log('✅ Found academy_id from DB:', tokenAcademyId, 'for user:', userId);
        } else {
          console.error('❌ User not found in DB:', userId);
        }
      } catch (dbError: any) {
        console.error('❌ DB error fetching user:', dbError.message);
      }
    }

    console.log('👥 by-academy API - Final values:', { userId, role, academyId: tokenAcademyId, email: userEmail });

    const upperRole = role;
    
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
      // Optional: academyId from query param for filtering
      const url = new URL(context.request.url);
      const requestedAcademyId = url.searchParams.get("academyId");
      if (requestedAcademyId) {
        const academyIdNum = Math.floor(parseFloat(requestedAcademyId));
        query += ` AND academy_id = ?`;
        bindings.push(academyIdNum);
      }
    } 
    // DIRECTOR/TEACHER: 자신의 학원 학생만 (토큰의 academyId 또는 userId 사용)
    else if (upperRole === 'DIRECTOR' || upperRole === 'TEACHER') {
      console.log('🏫 Director/Teacher access - fetching academy students');
      
      // academyId가 없으면 userId를 사용 (학원장 본인의 ID)
      const effectiveAcademyId = tokenAcademyId || userId;
      
      if (!effectiveAcademyId) {
        console.error('❌ No academy ID or user ID available');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Academy ID not found",
            message: "학원 정보가 없습니다. 사용자 정보를 확인해주세요.",
            students: [],
            debug: { userId, tokenAcademyId, role }
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      
      console.log('🔑 Using academy ID:', effectiveAcademyId);
      query += ` AND academy_id = ?`;
      bindings.push(effectiveAcademyId);
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
