// 학원장 academyId 자동 수정 API
// GET /api/admin/fix-director-academy

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null
  };
}

export async function onRequestGet(context) {
  const { DB } = context.env;
  
  try {
    // 인증 확인
    const authHeader = context.request.headers.get('Authorization');
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
    
    console.log('🔧 Fix Director Academy API called by:', tokenData.email, tokenData.role);
    
    // DIRECTOR만 실행 가능 (또는 ADMIN/SUPER_ADMIN이 특정 이메일 지정)
    const url = new URL(context.request.url);
    const targetEmail = url.searchParams.get('email');
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPER_AD'].includes(tokenData.role);
    
    let emailToFix = null;
    
    if (isAdmin && targetEmail) {
      // 관리자가 특정 이메일 지정
      emailToFix = targetEmail;
      console.log('👑 Admin fixing:', emailToFix);
    } else if (tokenData.role === 'DIRECTOR') {
      // 학원장 본인
      emailToFix = tokenData.email;
      console.log('🏫 Director self-fixing:', emailToFix);
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only DIRECTOR or ADMIN can use this API'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // User 테이블에서 사용자 정보 조회
    let user = await DB.prepare(`
      SELECT id, email, name, role, academyId
      FROM User
      WHERE email = ?
    `).bind(emailToFix).first();
    
    if (!user) {
      // users 테이블 시도
      user = await DB.prepare(`
        SELECT id, email, name, role, academyId
        FROM users
        WHERE email = ?
      `).bind(emailToFix).first();
    }
    
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('👤 User found:', { id: user.id, role: user.role, currentAcademyId: user.academyId });
    
    // academy 테이블에서 학원 찾기
    let academy = await DB.prepare(`
      SELECT id, name, code, directorEmail, directorId
      FROM academy
      WHERE directorEmail = ? OR directorId = ?
    `).bind(user.email, user.id).first();
    
    if (!academy) {
      // Academy 테이블 시도 (대문자)
      academy = await DB.prepare(`
        SELECT id, name, code, directorEmail, directorId
        FROM Academy
        WHERE directorEmail = ? OR directorId = ?
      `).bind(user.email, user.id).first();
    }
    
    if (!academy) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Academy not found for this director',
        message: '이 학원장과 연결된 학원을 찾을 수 없습니다'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🏫 Academy found:', { id: academy.id, name: academy.name });
    
    // academyId가 이미 올바르면 스킵
    if (user.academyId === academy.id) {
      return new Response(JSON.stringify({
        success: true,
        message: 'academyId already correct',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          academyId: user.academyId
        },
        academy: {
          id: academy.id,
          name: academy.name,
          code: academy.code
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // User 테이블 업데이트
    let updated = false;
    try {
      await DB.prepare(`
        UPDATE User SET academyId = ? WHERE id = ?
      `).bind(academy.id, user.id).run();
      updated = true;
      console.log('✅ User.academyId updated');
    } catch (e) {
      console.log('⚠️ User table update failed:', e.message);
      // users 테이블 시도
      try {
        await DB.prepare(`
          UPDATE users SET academyId = ? WHERE id = ?
        `).bind(academy.id, user.id).run();
        updated = true;
        console.log('✅ users.academyId updated');
      } catch (e2) {
        console.error('❌ Both tables update failed');
      }
    }
    
    if (!updated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update academyId'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'academyId updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        academyId: academy.id
      },
      academy: {
        id: academy.id,
        name: academy.name,
        code: academy.code
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Fix Director Academy error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
