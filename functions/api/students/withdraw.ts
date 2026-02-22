// Cloudflare Pages Function: POST /api/students/withdraw
// 학생 퇴원 처리

import { decodeToken } from '../../_lib/auth';

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
    console.log('🎫 Token preview:', token.substring(0, 50) + '...');
    
    // 토큰 디코딩 (auth.ts의 decodeToken 사용)
    const payload = decodeToken(token);
    
    if (!payload) {
      console.error('❌ Token decode failed');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid token',
        message: 'JWT 토큰이 유효하지 않습니다.',
        debug: 'Failed to decode token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Decoded payload:', { id: payload.id || payload.userId, role: payload.role });
    
    const adminUserId = payload.id || payload.userId;
    const adminRole = payload.role;

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
    
    // users 테이블 먼저 시도, 실패하면 User 테이블 시도
    let studentCheck: any = null;
    try {
      studentCheck = await env.DB.prepare(
        'SELECT id, name, email, role FROM users WHERE id = ?'
      ).bind(studentId).first();
      console.log('✅ Found in users table');
    } catch (e) {
      console.log('⚠️ users table failed, trying User table');
      studentCheck = await env.DB.prepare(
        'SELECT id, name, email, role FROM User WHERE id = ?'
      ).bind(studentId).first();
    }

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
    
    // users 테이블 먼저 시도
    let updateSuccess = false;
    let tableName = 'users';
    
    try {
      const result = await env.DB.prepare(`
        UPDATE users 
        SET isWithdrawn = 1, 
            withdrawnAt = ?, 
            withdrawnReason = ?,
            withdrawnBy = ?
        WHERE id = ?
      `).bind(now, withdrawnReason, adminUserId, studentId).run();
      
      console.log('✅ Update successful on users table:', result.meta);
      updateSuccess = true;
    } catch (e: any) {
      console.error('⚠️ users table update failed:', e.message);
      
      // users 테이블 실패 시 User 테이블 시도
      try {
        const result = await env.DB.prepare(`
          UPDATE User 
          SET isWithdrawn = 1, 
              withdrawnAt = ?, 
              withdrawnReason = ?,
              withdrawnBy = ?
          WHERE id = ?
        `).bind(now, withdrawnReason, adminUserId, studentId).run();
        
        console.log('✅ Update successful on User table:', result.meta);
        tableName = 'User';
        updateSuccess = true;
      } catch (e2: any) {
        console.error('⚠️ User table update also failed:', e2.message);
        
        // 두 테이블 모두 실패 - 컬럼이 없을 가능성
        if (e2.message.includes('no such column') || e2.message.includes('isWithdrawn')) {
          console.log('📝 Adding isWithdrawn columns to both tables...');
          
          // users 테이블에 컬럼 추가 시도
          for (const table of ['users', 'User']) {
            try {
              await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN isWithdrawn INTEGER DEFAULT 0`).run();
              await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN withdrawnAt TEXT`).run();
              await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN withdrawnReason TEXT`).run();
              await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN withdrawnBy INTEGER`).run();
              console.log(`✅ Added columns to ${table} table`);
            } catch (alterErr) {
              console.log(`⚠️ Columns may already exist in ${table}:`, alterErr);
            }
          }
          
          // 다시 시도
          console.log('🔄 Retrying update after adding columns...');
          try {
            const retryResult = await env.DB.prepare(`
              UPDATE users 
              SET isWithdrawn = 1, withdrawnAt = ?, withdrawnReason = ?, withdrawnBy = ?
              WHERE id = ?
            `).bind(now, withdrawnReason, adminUserId, studentId).run();
            console.log('✅ Retry successful on users table');
            updateSuccess = true;
          } catch (retryErr) {
            const retryResult = await env.DB.prepare(`
              UPDATE User 
              SET isWithdrawn = 1, withdrawnAt = ?, withdrawnReason = ?, withdrawnBy = ?
              WHERE id = ?
            `).bind(now, withdrawnReason, adminUserId, studentId).run();
            console.log('✅ Retry successful on User table');
            updateSuccess = true;
          }
        } else {
          throw e2;
        }
      }
    }
    
    if (!updateSuccess) {
      throw new Error('Failed to update student withdrawal status');
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
