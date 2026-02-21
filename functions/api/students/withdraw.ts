// Cloudflare Pages Function: POST /api/students/withdraw
// 학생 퇴원 처리

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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
    
    // JWT 디코딩 (간단한 버전)
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
        message: '퇴원 처리 권한이 없습니다.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { studentId, withdrawnReason } = body;

    if (!studentId) {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: '학생 ID가 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!withdrawnReason || !withdrawnReason.trim()) {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: '퇴원 사유를 입력해주세요.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학생 존재 여부 확인 (isWithdrawn 체크 제외)
    const studentCheck = await env.DB.prepare(
      'SELECT id, name, email, role FROM User WHERE id = ?'
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
        message: '학생이 아닌 사용자는 퇴원 처리할 수 없습니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 퇴원 처리 (컬럼이 없으면 추가)
    const now = new Date().toISOString();
    
    // isWithdrawn 컬럼 확인 및 추가
    try {
      await env.DB.prepare(`
        UPDATE User 
        SET isWithdrawn = 1, 
            withdrawnAt = ?, 
            withdrawnReason = ?,
            withdrawnBy = ?
        WHERE id = ?
      `).bind(now, withdrawnReason, adminUserId, studentId).run();
    } catch (e: any) {
      // 컬럼이 없으면 추가하고 다시 시도
      if (e.message.includes('no such column') || e.message.includes('isWithdrawn')) {
        console.log('⚠️ isWithdrawn 컬럼 추가 중...');
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN isWithdrawn INTEGER DEFAULT 0').run();
        } catch (alterErr) {
          console.log('컬럼 추가 실패 (이미 있을 수 있음):', alterErr);
        }
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN withdrawnAt TEXT').run();
        } catch (alterErr) {
          console.log('컬럼 추가 실패 (이미 있을 수 있음):', alterErr);
        }
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN withdrawnReason TEXT').run();
        } catch (alterErr) {
          console.log('컬럼 추가 실패 (이미 있을 수 있음):', alterErr);
        }
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN withdrawnBy INTEGER').run();
        } catch (alterErr) {
          console.log('컬럼 추가 실패 (이미 있을 수 있음):', alterErr);
        }
        
        // 다시 시도
        await env.DB.prepare(`
          UPDATE User 
          SET isWithdrawn = 1, 
              withdrawnAt = ?, 
              withdrawnReason = ?,
              withdrawnBy = ?
          WHERE id = ?
        `).bind(now, withdrawnReason, adminUserId, studentId).run();
      } else {
        throw e;
      }
    }

    console.log(`✅ 학생 퇴원 처리 완료: ${studentCheck.name} (ID: ${studentId}), 사유: ${withdrawnReason}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: '퇴원 처리가 완료되었습니다.',
      studentId,
      studentName: studentCheck.name,
      withdrawnAt: now,
      withdrawnReason
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Student withdrawal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message || '퇴원 처리 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
