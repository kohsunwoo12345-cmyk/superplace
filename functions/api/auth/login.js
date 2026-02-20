// Cloudflare Pages Function - Login API (JavaScript)

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

    // Find user by email or phone
    const user = await db
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

    if (!user) {
      console.error('❌ User not found:', loginIdentifier);
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

    console.log('✅ User found:', { id: user.id, role: user.role, passwordLength: user.password.length });

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
        console.log('Expected:', user.password);
        console.log('Got:', hashHex);
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

    // Get client IP address
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Real-IP') || 
                     request.headers.get('X-Forwarded-For')?.split(',')[0] || 
                     'unknown';
    
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    
    console.log('📍 Client info:', { ip: clientIP, userAgent: userAgent.substring(0, 50) });

    // Update last login and IP (skip if columns don't exist)
    try {
      await db
        .prepare('UPDATE users SET lastLoginAt = datetime("now"), lastLoginIP = ? WHERE id = ?')
        .bind(clientIP, user.id)
        .run();
      console.log('✅ Updated lastLoginAt and lastLoginIP');
    } catch (e) {
      console.log('⚠️ lastLoginAt/lastLoginIP column not found, trying without IP');
      try {
        await db
          .prepare('UPDATE users SET lastLoginAt = datetime("now") WHERE id = ?')
          .bind(user.id)
          .run();
      } catch (e2) {
        console.log('⚠️ lastLoginAt column not found, skipping update');
      }
    }

    // Log login activity
    try {
      await db
        .prepare(`
          INSERT INTO login_logs (userId, ipAddress, userAgent, loginAt, success)
          VALUES (?, ?, ?, datetime('now'), 1)
        `)
        .bind(user.id, clientIP, userAgent)
        .run();
      console.log('✅ Login activity logged');
    } catch (e) {
      console.log('⚠️ login_logs table not found, skipping:', e.message);
      // Try to create table
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            ipAddress TEXT,
            userAgent TEXT,
            loginAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            success INTEGER DEFAULT 1
          )
        `).run();
        console.log('✅ Created login_logs table');
        
        // Retry insert
        await db
          .prepare(`
            INSERT INTO login_logs (userId, ipAddress, userAgent, loginAt, success)
            VALUES (?, ?, ?, datetime('now'), 1)
          `)
          .bind(user.id, clientIP, userAgent)
          .run();
        console.log('✅ Login activity logged after table creation');
      } catch (e2) {
        console.log('⚠️ Could not create login_logs table:', e2.message);
      }
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
