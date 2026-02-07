interface Env {
  DB: D1Database;
}

// 학생 목록 조회 (역할 및 권한 기반 필터링)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');
    const userId = url.searchParams.get('userId'); // 요청한 사용자 ID
    const userEmail = url.searchParams.get('email'); // 사용자 이메일 추가

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔍 Students API called with:', { role, academyId, userId, userEmail });

    // admin@superplace.co.kr 특수 처리 - 모든 학생 조회
    const isSuperAdminEmail = userEmail === 'admin@superplace.co.kr';
    
    let query = '';
    const params: any[] = [];

    // 역할별 쿼리 분기
    const isGlobalAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || isSuperAdminEmail;
    
    if (role === 'DIRECTOR') {
      // 원장: 해당 학원의 학생만 조회
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          a.name as academyName
        FROM users u
        LEFT JOIN academy a ON CAST(u.academyId AS TEXT) = CAST(a.id AS TEXT)
        WHERE UPPER(u.role) = 'STUDENT'
      `;

      if (academyId) {
        query += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
        params.push(String(academyId), parseInt(academyId));
        console.log('🔍 DIRECTOR filtering by academyId:', academyId);
      }

      query += ` LIMIT 100`;
    } else if (isGlobalAdmin) {
      // 관리자: 모든 학원의 모든 학생
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          a.name as academyName
        FROM users u
        LEFT JOIN academy a ON CAST(u.academyId AS TEXT) = CAST(a.id AS TEXT)
        WHERE UPPER(u.role) = 'STUDENT'
        LIMIT 100
      `;
      console.log('✅ Global admin - showing all STUDENTS');
    } else if (role === 'TEACHER' && userId) {
      // 선생님: 해당 학원의 학생만 조회
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId
        FROM users u
        WHERE UPPER(u.role) = 'STUDENT' AND u.academyId = ?
        LIMIT 100
      `;
      params.push(parseInt(academyId || '0'));
    } else {
      // 그 외의 경우 (학생 등): 빈 결과 반환
      return new Response(
        JSON.stringify({
          success: true,
          students: [],
          count: 0,
          message: "권한이 없습니다",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        students: result.results || [],
        count: (result.results || []).length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch students",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
