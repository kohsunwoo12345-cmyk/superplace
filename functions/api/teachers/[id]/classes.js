// Teacher Classes API - PUT /api/teachers/[id]/classes
// 교사 반 배정

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null,
    timestamp: parts[4] || null
  };
}

export async function onRequestPut(context) {
  try {
    const { request, env, params } = context;
    const db = env.DB;
    const teacherId = params.id;

    console.log('📚 반 배정 API 호출:', teacherId);

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 토큰 검증
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 사용자 조회
    let user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE id = ?')
      .bind(tokenData.id)
      .first();

    if (!user && tokenData.email) {
      user = await db
        .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';

    // 권한 확인 (DIRECTOR, ADMIN, SUPER_ADMIN만 가능)
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { classes } = body;

    if (!Array.isArray(classes)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Classes must be an array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('💾 반 배정 저장:', classes);

    // 반을 JSON 문자열로 변환
    const classesJson = JSON.stringify(classes);
    const now = new Date().toISOString();

    // User 테이블 업데이트
    const result = await db
      .prepare(`
        UPDATE User 
        SET assignedClasses = ?, updatedAt = ?
        WHERE id = ?
      `)
      .bind(classesJson, now, teacherId)
      .run();

    console.log('✅ 반 배정 업데이트 완료:', result.meta?.changes);

    if (result.meta?.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Teacher not found or no changes made'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return success immediately (avoid replica lag on SELECT)
    return new Response(JSON.stringify({
      success: true,
      message: '반 배정이 저장되었습니다',
      teacher: {
        id: teacherId,
        assignedClasses: classes
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 반 배정 오류:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '반 배정 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
