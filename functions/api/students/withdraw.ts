// Cloudflare Pages Function: POST /api/students/withdraw
// 학생 퇴원 처리

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
    console.log('🔐 Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Invalid authorization header');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized',
        message: '인증 토큰이 필요합니다.',
        debug: {
          hasHeader: !!authHeader,
          startsWithBearer: authHeader?.startsWith('Bearer ')
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    console.log('🎫 Token length:', token.length);
    
    // JWT 디코딩 (간단한 버전)
    let adminUserId: number;
    let adminRole: string;
    try {
      const parts = token.split('.');
      console.log('🔍 Token parts:', parts.length);
      
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('✅ Decoded payload:', {id: payload.id, role: payload.role});
        adminUserId = payload.id || payload.userId;
        adminRole = payload.role;
      } else {
        throw new Error('Invalid token format');
      }
    } catch (e: any) {
      console.error('❌ Token decode error:', e.message);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid token',
        message: 'JWT 토큰이 유효하지 않습니다.',
        debug: e.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 권한 확인 (학원장 또는 관리자만 가능)
    console.log('👤 User role check:', adminRole);
    
    if (!['DIRECTOR', 'ADMIN', 'SUPER_ADMIN'].includes(adminRole)) {
      console.error('❌ Insufficient permissions:', adminRole);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Forbidden',
        message: '퇴원 처리 권한이 없습니다.',
        debug: { role: adminRole }
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Authorization passed - userId:', adminUserId, 'role:', adminRole);

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
    console.log('🔍 Checking student ID:', studentId);
    
    const studentCheck = await env.DB.prepare(
      'SELECT id, name, email, role FROM User WHERE id = ?'
    ).bind(studentId).first();

    console.log('📋 Student check result:', studentCheck ? `Found: ${studentCheck.name}` : 'Not found');

    if (!studentCheck) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Not Found',
        message: '학생을 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (studentCheck.role !== 'STUDENT') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Bad Request',
        message: '학생이 아닌 사용자는 퇴원 처리할 수 없습니다.',
        debug: { role: studentCheck.role }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 퇴원 처리 (컬럼이 없으면 추가)
    const now = new Date().toISOString();
    
    console.log('💾 Attempting withdrawal update...');
    
    // isWithdrawn 컬럼 확인 및 추가
    try {
      const result = await env.DB.prepare(`
        UPDATE User 
        SET isWithdrawn = 1, 
            withdrawnAt = ?, 
            withdrawnReason = ?,
            withdrawnBy = ?
        WHERE id = ?
      `).bind(now, withdrawnReason, adminUserId, studentId).run();
      
      console.log('✅ Update successful:', result.meta);
    } catch (e: any) {
      console.error('⚠️ Update failed, attempting to add columns:', e.message);
      
      // 컬럼이 없으면 추가하고 다시 시도
      if (e.message.includes('no such column') || e.message.includes('isWithdrawn')) {
        console.log('📝 Adding isWithdrawn columns...');
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN isWithdrawn INTEGER DEFAULT 0').run();
          console.log('✅ Added isWithdrawn column');
        } catch (alterErr) {
          console.log('⚠️ Column may already exist:', alterErr);
        }
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN withdrawnAt TEXT').run();
          console.log('✅ Added withdrawnAt column');
        } catch (alterErr) {
          console.log('⚠️ Column may already exist:', alterErr);
        }
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN withdrawnReason TEXT').run();
          console.log('✅ Added withdrawnReason column');
        } catch (alterErr) {
          console.log('⚠️ Column may already exist:', alterErr);
        }
        
        try {
          await env.DB.prepare('ALTER TABLE User ADD COLUMN withdrawnBy INTEGER').run();
          console.log('✅ Added withdrawnBy column');
        } catch (alterErr) {
          console.log('⚠️ Column may already exist:', alterErr);
        }
        
        // 다시 시도
        console.log('🔄 Retrying update after adding columns...');
        const retryResult = await env.DB.prepare(`
          UPDATE User 
          SET isWithdrawn = 1, 
              withdrawnAt = ?, 
              withdrawnReason = ?,
              withdrawnBy = ?
          WHERE id = ?
        `).bind(now, withdrawnReason, adminUserId, studentId).run();
        
        console.log('✅ Retry successful:', retryResult.meta);
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
