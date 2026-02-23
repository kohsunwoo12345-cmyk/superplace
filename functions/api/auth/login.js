// Cloudflare Pages Function - Login API (JavaScript) - 모든 패턴 시도

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('🔐 Login API called');

    if (!db) {
      console.error('❌ DB binding not found');
      return new Response(
        JSON.stringify({
          success: false,
          message: '데이터베이스가 연결되지 않았습니다',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await request.json();
    const { email, phone, password } = data;

    const loginIdentifier = email || phone;

    console.log('📋 Login attempt:', { email, phone, loginIdentifier });

    // Validation
    if (!loginIdentifier || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일/연락처와 비밀번호를 입력해주세요',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 여러 패턴으로 사용자 찾기 시도
    let user = null;
    
    // 패턴 1: users + academyId (camelCase)
    try {
      console.log('🔍 시도 1: users 테이블 + academyId (camelCase)');
      user = await db
        .prepare(`
          SELECT 
            u.id,
            u.email,
            u.password,
            u.name,
            u.role,
            u.phone,
            u.academyId,
            u.approved,
            a.name as academyName,
            a.code as academyCode
          FROM users u
          LEFT JOIN academy a ON u.academyId = a.id
          WHERE u.email = ? OR u.phone = ?
        `)
        .bind(loginIdentifier, loginIdentifier)
        .first();
      
      if (user) {
        console.log('✅ 패턴 1 성공 (users + academyId)');
      }
    } catch (e) {
      console.log('❌ 패턴 1 실패:', e.message);
    }

    // 패턴 2: User + academyId (대문자 시작)
    if (!user) {
      try {
        console.log('🔍 시도 2: User 테이블 + academyId');
        user = await db
          .prepare(`
            SELECT 
              u.id,
              u.email,
              u.password,
              u.name,
              u.role,
              u.phone,
              u.academyId,
              u.approved,
              a.name as academyName,
              a.code as academyCode
            FROM User u
            LEFT JOIN Academy a ON u.academyId = a.id
            WHERE u.email = ? OR u.phone = ?
          `)
          .bind(loginIdentifier, loginIdentifier)
          .first();
        
        if (user) {
          console.log('✅ 패턴 2 성공 (User + academyId)');
        }
      } catch (e) {
        console.log('❌ 패턴 2 실패:', e.message);
      }
    }

    // 패턴 3: users + academy_id (snake_case)
    if (!user) {
      try {
        console.log('🔍 시도 3: users 테이블 + academy_id (snake_case)');
        user = await db
          .prepare(`
            SELECT 
              u.id,
              u.email,
              u.password,
              u.name,
              u.role,
              u.phone,
              u.academy_id as academyId,
              u.approved,
              a.name as academyName,
              a.code as academyCode
            FROM users u
            LEFT JOIN academy a ON u.academy_id = a.id
            WHERE u.email = ? OR u.phone = ?
          `)
          .bind(loginIdentifier, loginIdentifier)
          .first();
        
        if (user) {
          console.log('✅ 패턴 3 성공 (users + academy_id)');
        }
      } catch (e) {
        console.log('❌ 패턴 3 실패:', e.message);
      }
    }

    if (!user) {
      console.error('❌ User not found in all patterns:', loginIdentifier);
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일/연락처 또는 비밀번호가 올바르지 않습니다',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User found:', { id: user.id, role: user.role, passwordLength: user.password?.length });

    let isValid = false;

    // Check if password is bcrypt (starts with $2a$ or $2b$ and length 60)
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) && user.password.length === 60) {
      console.log('🔐 Verifying password with bcrypt...');
      try {
        // Import bcrypt dynamically
        const bcrypt = await import('bcryptjs');
        isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
          console.log('✅ Password verified with bcrypt');
        } else {
          console.error('❌ Bcrypt verification failed');
        }
      } catch (e) {
        console.error('❌ Bcrypt error:', e.message);
      }
    }
    
    // If not valid yet, try SHA-256
    if (!isValid) {
      console.log('🔐 Verifying password with SHA-256...');
      const encoder = new TextEncoder();
      const data2 = encoder.encode(password + 'superplace-salt-2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data2);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      isValid = hashHex === user.password;
      
      if (isValid) {
        console.log('✅ Password verified with SHA-256');
      } else {
        console.error('❌ SHA-256 verification failed');
      }
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check approval status (except DIRECTOR)
    if (user.approved === 0 && user.role !== 'DIRECTOR') {
      return new Response(
        JSON.stringify({
          success: false,
          message: '아직 학원장의 승인이 완료되지 않았습니다.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate token with academyId
    const token = `${user.id}|${user.email}|${user.role}|${user.academyId || ''}|${Date.now()}`;

    console.log('✅ Login successful:', { userId: user.id, role: user.role, academyId: user.academyId });

    return new Response(
      JSON.stringify({
        success: true,
        message: '로그인 성공',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          academyId: user.academyId,
          academyName: user.academyName,
          academyCode: user.academyCode,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Login error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '로그인 중 오류가 발생했습니다',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
