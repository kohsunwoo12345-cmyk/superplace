import { getUserFromAuth } from '../../_lib/auth';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/by-academy
 * 학원별 학생 목록 조회 (RBAC 적용 - JWT 토큰 기반)
 * - ADMIN/SUPER_ADMIN: 모든 학생 조회 (academyId 쿼리 파라미터로 필터 가능)
 * - DIRECTOR/TEACHER: 자신의 학원 학생만 조회
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
    
    // 여러 스키마 패턴 시도 (실제 DB는 academy_id INTEGER를 사용하므로 패턴 1을 먼저 시도)
    let result: any = null;
    let successPattern = '';
    
    // 패턴 1 (우선): users + academy_id/academyId (숫자면 INTEGER, 문자열이면 TEXT)
    try {
      console.log('🔍 시도 1: users 테이블 + academy_id/academyId');
      
      // academyId가 숫자인지 문자열인지 판단
      const isStringAcademyId = tokenAcademyId && typeof tokenAcademyId === 'string' && isNaN(parseInt(tokenAcademyId));
      
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.academy_id,
          u.academyId,
          u.role,
          s.id as studentId,
          s.grade,
          s.status
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.role = 'STUDENT'
      `;

      const bindings: any[] = [];

      if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
        const url = new URL(context.request.url);
        const requestedAcademyId = url.searchParams.get("academyId");
        if (requestedAcademyId) {
          const isRequestStringId = isNaN(parseInt(requestedAcademyId));
          if (isRequestStringId) {
            query += ` AND u.academyId = ?`;
            bindings.push(requestedAcademyId);
          } else {
            query += ` AND u.academy_id = ?`;
            bindings.push(parseInt(requestedAcademyId));
          }
        }
      } else if (upperRole === 'DIRECTOR' || upperRole === 'TEACHER') {
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
        
        // academyId가 문자열이면 TEXT 컬럼, 숫자면 INTEGER 컬럼
        if (isStringAcademyId) {
          query += ` AND u.academyId = ?`;
          bindings.push(tokenAcademyId);
          console.log(`🏫 ${upperRole} - Filtering by academyId (TEXT):`, tokenAcademyId);
        } else {
          query += ` AND u.academy_id = ?`;
          const academyIdInt = typeof tokenAcademyId === 'string' ? parseInt(tokenAcademyId) : tokenAcademyId;
          bindings.push(academyIdInt);
          console.log(`🏫 ${upperRole} - Filtering by academy_id (INTEGER):`, academyIdInt);
        }
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Unauthorized access",
            message: "접근 권한이 없습니다",
            students: []
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      query += ` ORDER BY u.id DESC`;

      console.log('📊 패턴 1 Query:', query, 'Bindings:', bindings);
      result = await DB.prepare(query).bind(...bindings).all();
      successPattern = 'users + academy_id/academyId';
      console.log('✅ 패턴 1 성공:', result.results.length, '명');
    } catch (e1: any) {
      console.log('❌ 패턴 1 실패:', e1.message);
    }

    // 패턴 2: User + academy_id (PascalCase 테이블)
    if (!result || result.results.length === 0) {
      try {
        console.log('🔍 시도 2: User 테이블 + academy_id');
        
        let query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.academy_id as academyId,
            u.role,
            s.id as studentId,
            s.grade,
            s.status
          FROM User u
          LEFT JOIN students s ON u.id = s.user_id
          WHERE u.role = 'STUDENT'
        `;

        const bindings: any[] = [];

        if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
          const url = new URL(context.request.url);
          const requestedAcademyId = url.searchParams.get("academyId");
          if (requestedAcademyId) {
            query += ` AND u.academy_id = ?`;
            bindings.push(parseInt(requestedAcademyId));
          }
        } else if (upperRole === 'DIRECTOR' || upperRole === 'TEACHER') {
          query += ` AND u.academy_id = ?`;
          const academyIdInt = typeof tokenAcademyId === 'string' ? parseInt(tokenAcademyId) : tokenAcademyId;
          bindings.push(academyIdInt);
        }

        query += ` ORDER BY u.id DESC`;

        console.log('📊 패턴 2 Query:', query, bindings);
        result = await DB.prepare(query).bind(...bindings).all();
        successPattern = 'User + academy_id';
        console.log('✅ 패턴 2 성공:', result.results.length, '명');
      } catch (e2: any) {
        console.log('❌ 패턴 2 실패:', e2.message);
      }
    }

    // 패턴 3 (최후): users + academyId (TEXT 타입 대비)
    if (!result || result.results.length === 0) {
      try {
        console.log('🔍 시도 3: users 테이블 + academyId (TEXT)');
        
        let query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.academyId,
            u.role,
            s.id as studentId,
            s.grade,
            s.status
          FROM users u
          LEFT JOIN students s ON u.id = s.userId
          WHERE u.role = 'STUDENT'
        `;

        const bindings: any[] = [];

        if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
          const url = new URL(context.request.url);
          const requestedAcademyId = url.searchParams.get("academyId");
          if (requestedAcademyId) {
            query += ` AND u.academyId = ?`;
            bindings.push(requestedAcademyId);
          }
        } else if (upperRole === 'DIRECTOR' || upperRole === 'TEACHER') {
          query += ` AND u.academyId = ?`;
          bindings.push(tokenAcademyId?.toString());
        }

        query += ` ORDER BY u.id DESC`;

        console.log('📊 패턴 3 Query:', query, bindings);
        result = await DB.prepare(query).bind(...bindings).all();
        successPattern = 'users + academyId (TEXT)';
        console.log('✅ 패턴 3 성공:', result.results.length, '명');
      } catch (e3: any) {
        console.log('❌ 패턴 3 실패:', e3.message);
      }
    }

    if (!result) {
      console.error('❌ 모든 패턴 실패');
      return new Response(
        JSON.stringify({
          success: false,
          error: "All schema patterns failed",
          message: "데이터베이스 조회 실패",
          students: []
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🎯 사용된 패턴: ${successPattern}`);
    
    console.log('🔍 Raw DB result:', JSON.stringify(result.results?.slice(0, 2), null, 2));
    console.log('🔍 Result count:', result.results?.length || 0);
    
    const students = (result.results || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      studentCode: s.id,
      grade: s.grade,
      phone: s.phone,
      academyId: s.academyId,
      status: s.status || 'ACTIVE'
    }));
    
    console.log('✅ Students found:', students.length);
    console.log('📝 First student:', students[0]);
    console.log(`🎯 Success pattern: ${successPattern}`);

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
