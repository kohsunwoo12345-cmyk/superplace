// Cloudflare Pages Function - Login API (JavaScript) - 모든 패턴 시도
// Updated: 2026-03-17 - SHA-256 + plaintext support

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
    // CRITICAL: Use batch() to force PRIMARY DB read and avoid replica lag
    let user = null;
    
    // 패턴 1: users + academyId (camelCase)
    try {
      console.log('🔍 시도 1: users 테이블 + academyId (camelCase) [batch]');
      const stmt = db.prepare(`
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
      `).bind(loginIdentifier, loginIdentifier);
      
      const batchResults = await db.batch([stmt]);
      user = batchResults[0].results[0];
      
      if (user) {
        console.log('✅ 패턴 1 성공 (users + academyId)');
      }
    } catch (e) {
      console.log('❌ 패턴 1 실패:', e.message);
    }

    // 패턴 2: User + academyId (대문자 시작)
    if (!user) {
      try {
        console.log('🔍 시도 2: User 테이블 + academyId [batch]');
        const stmt = db.prepare(`
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
        `).bind(loginIdentifier, loginIdentifier);
        
        const batchResults = await db.batch([stmt]);
        user = batchResults[0].results[0];
        
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
        console.log('🔍 시도 3: users 테이블 + academy_id (snake_case) [batch]');
        const stmt = db.prepare(`
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
        `).bind(loginIdentifier, loginIdentifier);
        
        const batchResults = await db.batch([stmt]);
        user = batchResults[0].results[0];
        
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
    console.log('🔐 Stored password hash (first 20 chars):', user.password?.substring(0, 20));

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
      
      console.log('🔐 Computed hash (first 20 chars):', hashHex.substring(0, 20));
      console.log('🔐 Stored hash (first 20 chars):', user.password?.substring(0, 20));
      console.log('🔐 Full computed hash:', hashHex);
      console.log('🔐 Full stored hash:', user.password);
      
      isValid = hashHex === user.password;
      
      if (isValid) {
        console.log('✅ Password verified with SHA-256');
      } else {
        console.error('❌ SHA-256 verification failed');
        console.error('❌ Hashes do not match');
      }
    }
    
    // 🆕 If still not valid, try plaintext comparison (for legacy users)
    if (!isValid) {
      console.log('🔐 Trying plaintext password comparison...');
      isValid = password === user.password;
      if (isValid) {
        console.log('✅ Password verified with plaintext (legacy mode)');
        console.warn('⚠️ WARNING: User has plaintext password - should be migrated to hash!');
      } else {
        console.error('❌ Plaintext verification also failed');
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

    // 🆕 IP 주소 및 디바이스 정보 수집
    const ipAddress = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                      request.headers.get('X-Real-IP') ||
                      'Unknown';
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const cfCountry = request.headers.get('CF-IPCountry') || null;
    
    // 디바이스 타입 추론
    let deviceType = 'Unknown';
    if (userAgent.includes('Mobile')) deviceType = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceType = 'Tablet';
    else if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) deviceType = 'Desktop';
    
    console.log('📍 Login IP info:', { ipAddress, deviceType, country: cfCountry });

    // 🆕 로그인 로그 기록 (user_login_logs 테이블)
    try {
      // user_login_logs 테이블 생성
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS user_login_logs (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          deviceType TEXT,
          country TEXT,
          loginAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (userId) REFERENCES User(id)
        )
      `).run();

      // 로그 삽입
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db.prepare(`
        INSERT INTO user_login_logs (id, userId, ipAddress, userAgent, deviceType, country)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        logId,
        user.id,
        ipAddress,
        userAgent,
        deviceType,
        cfCountry
      ).run();

      console.log('✅ Login log recorded:', logId);
    } catch (logError) {
      console.error('⚠️ Failed to record login log:', logError.message);
      // 로그 실패해도 로그인은 성공으로 처리
    }

    // 🆕 ActivityLog에도 로그인 기록 저장 (상세 정보 포함)
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS ActivityLog (
          id TEXT PRIMARY KEY,
          userId TEXT,
          action TEXT NOT NULL,
          details TEXT,
          ip TEXT,
          userAgent TEXT,
          deviceType TEXT,
          country TEXT,
          userRole TEXT,
          academyId TEXT,
          academyName TEXT,
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
      // 컬럼 추가 시도 (이미 있으면 무시)
      for (const col of ['userAgent TEXT', 'deviceType TEXT', 'country TEXT', 'userRole TEXT', 'academyId TEXT', 'academyName TEXT']) {
        try { await db.prepare(`ALTER TABLE ActivityLog ADD COLUMN ${col}`).run(); } catch(e) {}
      }
      const actLogId = `activity-login-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db.prepare(`
        INSERT INTO ActivityLog (id, userId, action, details, ip, userAgent, deviceType, country, userRole, academyId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        actLogId,
        user.id,
        '로그인',
        `${user.name || user.email} 님이 로그인하였습니다 (역할: ${user.role || '-'})`,
        ipAddress,
        userAgent,
        deviceType,
        cfCountry,
        user.role || '',
        user.academyId || ''
      ).run();
      console.log('✅ ActivityLog login recorded:', actLogId);
    } catch (actLogError) {
      console.error('⚠️ Failed to record ActivityLog login:', actLogError.message);
    }

    // 🆕 User 테이블에 최근 로그인 정보 업데이트 (User 또는 users 테이블 모두 시도)
    try {
      await db.prepare(`
        UPDATE User SET 
          lastLoginAt = datetime('now'),
          lastLoginIp = ?
        WHERE id = ?
      `).bind(ipAddress, user.id).run();
    } catch (e) {
      try {
        await db.prepare(`
          UPDATE users SET 
            lastLoginAt = datetime('now'),
            lastLoginIp = ?
          WHERE id = ?
        `).bind(ipAddress, user.id).run();
      } catch (e2) {
        console.log('⚠️ Could not update lastLogin fields (columns may not exist)');
      }
    }

    // 🆕 DIRECTOR인데 academyId가 없으면 academy 테이블에서 찾기
    if (user.role === 'DIRECTOR' && !user.academyId) {
      console.log('🔍 DIRECTOR인데 academyId 없음 - academy 테이블에서 조회');
      try {
        const academy = await db.prepare(`
          SELECT id, name, code
          FROM academy
          WHERE directorId = ? OR directorEmail = ?
          LIMIT 1
        `).bind(user.id, user.email).first();
        
        if (academy) {
          console.log(`✅ 학원 발견: ${academy.name} (${academy.id})`);
          user.academyId = academy.id;
          user.academyName = academy.name;
          user.academyCode = academy.code;
          
          // DB 업데이트 (User 테이블)
          try {
            await db.prepare(`
              UPDATE User SET academyId = ? WHERE id = ?
            `).bind(academy.id, user.id).run();
            console.log('✅ User.academyId 업데이트 완료');
          } catch (e) {
            // users 테이블 시도
            try {
              await db.prepare(`
                UPDATE users SET academyId = ? WHERE id = ?
              `).bind(academy.id, user.id).run();
              console.log('✅ users.academyId 업데이트 완료');
            } catch (e2) {
              console.warn('⚠️ academyId 업데이트 실패:', e2.message);
            }
          }
        } else {
          console.warn('⚠️ 학원을 찾을 수 없음');
        }
      } catch (e) {
        console.error('❌ academyId 조회 실패:', e.message);
      }
    }

    // Generate token with academyId
    const token = `${user.id}|${user.email}|${user.role}|${user.academyId || ''}|${Date.now()}`;

    console.log('✅ Login successful:', { userId: user.id, role: user.role, academyId: user.academyId, ip: ipAddress });

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
