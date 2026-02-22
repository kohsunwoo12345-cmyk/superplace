// Cloudflare Pages Function: POST /api/students/reactivate
// 학생 퇴원 취소 (복학)

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// POST 메소드만 처리
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // JWT 디코딩
    let adminUserId: number;
    let adminRole: string;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        adminUserId = payload.id || payload.userId;
        adminRole = payload.role;
      } else {
        throw new Error('Invalid token');
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 권한 확인 (학원장 또는 관리자만 가능)
    if (!['DIRECTOR', 'ADMIN', 'SUPER_ADMIN'].includes(adminRole)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: '복학 처리 권한이 없습니다.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: '학생 ID가 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학생 존재 여부 확인
    const studentCheck = await env.DB.prepare(
      'SELECT id, name, email, role, isWithdrawn FROM User WHERE id = ?'
    ).bind(studentId).first();

    if (!studentCheck) {
      return new Response(JSON.stringify({ 
        error: 'Not Found',
        message: '학생을 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (studentCheck.role !== 'STUDENT') {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: '학생이 아닌 사용자는 복학 처리할 수 없습니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (studentCheck.isWithdrawn !== 1) {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: '퇴원 상태가 아닌 학생은 복학 처리할 수 없습니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 복학 처리 (퇴원 정보 초기화)
    await env.DB.prepare(`
      UPDATE User 
      SET isWithdrawn = 0, 
          withdrawnAt = NULL, 
          withdrawnReason = NULL,
          withdrawnBy = NULL
      WHERE id = ?
    `).bind(studentId).run();

    console.log(`✅ 학생 복학 처리 완료: ${studentCheck.name} (ID: ${studentId})`);

    return new Response(JSON.stringify({ 
      success: true,
      message: '복학 처리가 완료되었습니다.',
      studentId,
      studentName: studentCheck.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Student reactivation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message || '복학 처리 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
