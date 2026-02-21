// Cloudflare Pages Function: POST /api/students/restore-all
// 모든 학생을 재학 상태로 복구

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
    let adminRole: string;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
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

    // 권한 확인 (관리자만 가능)
    if (!['SUPER_ADMIN'].includes(adminRole)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: '최고 관리자만 전체 복구가 가능합니다.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 먼저 컬럼이 있는지 확인
    try {
      await env.DB.prepare(`
        SELECT isWithdrawn FROM User LIMIT 1
      `).first();
    } catch (e: any) {
      // 컬럼이 없으면 추가
      console.log('⚠️ isWithdrawn 컬럼이 없습니다. 추가합니다...');
      await env.DB.prepare(`
        ALTER TABLE User ADD COLUMN isWithdrawn INTEGER DEFAULT 0
      `).run();
      
      await env.DB.prepare(`
        ALTER TABLE User ADD COLUMN withdrawnAt TEXT
      `).run();
      
      await env.DB.prepare(`
        ALTER TABLE User ADD COLUMN withdrawnReason TEXT
      `).run();
      
      await env.DB.prepare(`
        ALTER TABLE User ADD COLUMN withdrawnBy INTEGER
      `).run();
      
      console.log('✅ 컬럼 추가 완료');
    }

    // 모든 학생의 isWithdrawn을 0으로 설정
    const result = await env.DB.prepare(`
      UPDATE User 
      SET isWithdrawn = 0,
          withdrawnAt = NULL,
          withdrawnReason = NULL,
          withdrawnBy = NULL
      WHERE role = 'STUDENT'
    `).run();

    console.log(`✅ 학생 전체 복구 완료: ${result.meta.changes}명`);

    return new Response(JSON.stringify({ 
      success: true,
      message: '모든 학생이 복구되었습니다.',
      restoredCount: result.meta.changes
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Student restore all error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message || '복구 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
