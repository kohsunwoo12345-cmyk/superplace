// 교사 목록 조회 API
// GET /api/teachers/manage

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Database not configured" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "인증 토큰이 필요합니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // JWT 토큰 디코딩
    let userEmail = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        userEmail = payload.email;
      }
    } catch (e) {
      console.error('토큰 파싱 오류:', e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "유효하지 않은 토큰입니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('👨‍🏫 교사 목록 조회 요청:', { userEmail });

    // DB에서 사용자 정보 조회
    const user = await env.DB.prepare(`
      SELECT id, email, role, academyId
      FROM User
      WHERE email = ?
    `).bind(userEmail).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "사용자를 찾을 수 없습니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 권한 확인: SUPER_ADMIN, ADMIN, DIRECTOR만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "교사 관리 권한이 없습니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let query;
    let params = [];

    // 역할별 필터링
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      // 관리자는 모든 교사 조회
      query = `
        SELECT u.id, u.email, u.name, u.phone, u.role, u.academyId, u.createdAt,
               a.name as academyName, a.code as academyCode
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE u.role = 'TEACHER'
        ORDER BY u.name ASC
      `;
    } else if (user.role === 'DIRECTOR') {
      // 원장은 자기 학원의 교사만 조회
      if (!user.academyId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "학원 정보가 없습니다" 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      query = `
        SELECT u.id, u.email, u.name, u.phone, u.role, u.academyId, u.createdAt,
               a.name as academyName, a.code as academyCode
        FROM User u
        LEFT JOIN Academy a ON u.academyId = a.id
        WHERE u.role = 'TEACHER' AND u.academyId = ?
        ORDER BY u.name ASC
      `;
      params.push(user.academyId);
    }

    const teachersResult = await env.DB.prepare(query).bind(...params).all();
    const teachers = teachersResult.results || [];

    console.log('✅ 교사 목록 조회 완료:', {
      userRole: user.role,
      teacherCount: teachers.length,
      academyId: user.academyId
    });

    return new Response(JSON.stringify({
      success: true,
      teachers,
      count: teachers.length,
      userRole: user.role,
      academyId: user.academyId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("교사 목록 조회 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "교사 목록 조회 실패"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
