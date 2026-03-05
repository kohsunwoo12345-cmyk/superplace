// Cloudflare Pages Function - Signup API
// Converted to JavaScript for Cloudflare Pages compatibility

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAcademyCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

async function hashPassword(password) {
  // Use SHA-256 with salt for password hashing
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Signup API called');

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
    const { email, password, name, phone, role, academyName, academyAddress, academyCode } = data;

    console.log('📋 Signup request:', { email, name, role });

    // Validation
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '필수 정보를 모두 입력해주세요',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '올바른 이메일 형식이 아닙니다',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Password length validation
    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '비밀번호는 최소 8자 이상이어야 합니다',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for existing user
    const existingUser = await db
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이미 사용 중인 이메일입니다',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Hash password using SHA-256
    const hashedPassword = await hashPassword(password);
    const userId = generateId('user');
    let academyId;
    let newAcademyCode;

    // DIRECTOR: Create academy
    if (role === 'DIRECTOR') {
      if (!academyName) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '학원 이름을 입력해주세요',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const finalAddress = academyAddress || '주소 미입력';

      academyId = generateId('academy');
      newAcademyCode = generateAcademyCode();

      console.log('🏫 Creating academy:', { academyId, academyName, newAcademyCode });

      await db
        .prepare(`
          INSERT INTO Academy (id, name, code, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `)
        .bind(
          academyId,
          academyName,
          newAcademyCode,
          finalAddress,
          phone || '',
          email,
          'FREE',
          10,
          2,
          1
        )
        .run();

      console.log('✅ Academy created');
    }

    // TEACHER or STUDENT: Find academy
    if (role === 'TEACHER' || role === 'STUDENT') {
      if (!academyCode) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '학원 코드를 입력해주세요',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const academy = await db
        .prepare('SELECT id FROM Academy WHERE code = ?')
        .bind(academyCode)
        .first();

      if (!academy) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '올바른 학원 코드가 아닙니다',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      academyId = academy.id;
      console.log('✅ Academy found:', academyId);
    }

    // Create user
    await db
      .prepare(`
        INSERT INTO User (id, email, password, name, role, phone, academyId, approved, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(
        userId,
        email,
        hashedPassword,
        name,
        role,
        phone || '',
        academyId || null,
        role === 'DIRECTOR' ? 1 : 0
      )
      .run();

    console.log('✅ User created:', { userId, email, role });

    // 🆕 회원가입 로그 기록 (ActivityLog 테이블)
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 
                 request.headers.get('X-Forwarded-For') || 
                 'Unknown';
      const logId = `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await db
        .prepare(`
          INSERT INTO ActivityLog (id, userId, action, details, ip, createdAt)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `)
        .bind(
          logId,
          userId,
          '회원가입',
          `신규 회원 가입 - 역할: ${role}${academyId ? ', 학원 가입' : ''}`,
          ip
        )
        .run();
      
      console.log('✅ Signup activity log created');
    } catch (logError) {
      console.error('⚠️ Failed to create activity log:', logError);
      // 로그 실패는 회원가입을 방해하지 않음
    }

    const responseData = {
      success: true,
      message: '회원가입이 완료되었습니다',
      user: {
        id: userId,
        email,
        name,
        role,
        academyId,
      }
    };

    if (role === 'DIRECTOR' && newAcademyCode) {
      responseData.academyCode = newAcademyCode;
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입 중 오류가 발생했습니다',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
