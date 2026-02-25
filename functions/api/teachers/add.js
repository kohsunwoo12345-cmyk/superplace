// Teacher Add API - JavaScript version
// POST /api/teachers/add
// Last updated: 2026-02-25 12:30:00

// Simple token parser
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Auth header invalid format');
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  console.log('🔍 Token parts count:', parts.length);
  console.log('🔍 Token parts:', parts.map((p, i) => `[${i}]: ${p.substring(0, 20)}...`));
  
  if (parts.length < 3) {
    console.error('❌ Token has less than 3 parts');
    return null;
  }
  
  const parsed = {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null,
    timestamp: parts[4] || null
  };
  
  console.log('✅ Token parsed successfully:', { id: parsed.id, email: parsed.email, role: parsed.role, academyId: parsed.academyId });
  
  return parsed;
}

// Simple hash function (SHA-256 with salt - matches login.js)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  // IMPORTANT: Use the same salt as login.js for consistency
  const data = encoder.encode(password + 'superplace-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Teacher add API called');

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token and verify permissions
    const authHeader = request.headers.get('Authorization');
    
    console.log('🔐 Auth header present:', !!authHeader);
    console.log('🔐 Auth header value:', authHeader ? `${authHeader.substring(0, 50)}...` : 'NULL');
    
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ Invalid or missing token');
      console.error('❌ Auth header:', authHeader);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: '인증 토큰이 유효하지 않습니다'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Token parsed:', { id: tokenData.id, email: tokenData.email, role: tokenData.role });

    // Get user from database - try by id first, then email
    let user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE id = ?')
      .bind(tokenData.id)
      .first();
    
    if (!user && tokenData.email) {
      console.log('⚠️ User not found by id, trying email:', tokenData.email);
      user = await db
        .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    if (!user) {
      console.error('❌ User not found in database');
      console.error('❌ Searched by id:', tokenData.id);
      console.error('❌ Searched by email:', tokenData.email);
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
        message: '사용자를 찾을 수 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role, academyId: user.academyId });

    const role = user.role ? user.role.toUpperCase() : '';

    // Check permissions (only DIRECTOR, ADMIN, SUPER_ADMIN can add teachers)
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, email, phone, password } = body;

    console.log('📝 Teacher add data:', { name, email, phone });

    // Validation - email is now REQUIRED
    if (!name || !email || !phone || !password) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({
        success: false,
        error: '이름, 이메일, 전화번호, 비밀번호는 필수입니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      return new Response(JSON.stringify({
        success: false,
        error: '올바른 이메일 형식이 아닙니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use requester's academyId
    const academyId = user.academyId;
    
    if (!academyId) {
      console.error('❌ Academy ID not found for user');
      return new Response(JSON.stringify({
        success: false,
        error: 'Academy ID not found'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🏫 Academy ID:', academyId);

    // Check for existing phone in User table
    const existingUserByPhone = await db
      .prepare('SELECT id FROM User WHERE phone = ?')
      .bind(phone)
      .first();

    if (existingUserByPhone) {
      console.error('❌ Phone already exists:', phone);
      return new Response(JSON.stringify({
        success: false,
        error: '이미 존재하는 전화번호입니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for existing email (email is now required)
    const existingUserByEmail = await db
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email)
      .first();

    if (existingUserByEmail) {
      console.error('❌ Email already exists:', email);
      return new Response(JSON.stringify({
        success: false,
        error: '이미 존재하는 이메일입니다'
      }), {
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password with salt (matches login.js)
    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(password);

    // Generate teacher ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const teacherId = `teacher-${timestamp}-${randomStr}`;

    const now = new Date().toISOString();

    console.log('➕ Inserting new teacher into User table...');
    console.log('📋 Teacher details:');
    console.log('  - Teacher ID:', teacherId);
    console.log('  - Name:', name);
    console.log('  - Email:', email);
    console.log('  - Phone:', phone);
    console.log('  - Academy ID:', academyId);
    console.log('  - Role: TEACHER');
    console.log('  - Approved: 1');
    console.log('  - isWithdrawn: 0');

    // Simple INSERT - do NOT use batch() as it may not commit properly
    const result = await db
      .prepare(`
        INSERT INTO User 
        (id, email, password, name, phone, role, academyId, approved, isWithdrawn, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'TEACHER', ?, 1, 0, ?, ?)
      `)
      .bind(teacherId, email, hashedPassword, name, phone, academyId, now, now)
      .run();

    console.log('✅ INSERT 실행 완료');
    console.log('📊 Affected rows:', result.meta?.changes || 0);
    console.log('📊 Last row ID:', result.meta?.last_row_id || 'N/A');
    console.log('📊 Success:', result.success);

    if (result.meta?.changes === 0) {
      console.error('❌ Insert failed - no rows affected');
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to insert teacher - no rows affected'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Teacher successfully inserted into database');

    // Return the teacher data directly
    const newTeacher = {
      id: teacherId,
      email: email,
      name: name,
      phone: phone,
      role: 'TEACHER',
      academyId: academyId,
      approved: 1,
      isWithdrawn: 0,
      permissions: [],
      assignedClasses: [],
      createdAt: now,
      updatedAt: now
    };

    console.log('✅ Returning teacher data:', newTeacher);

    return new Response(JSON.stringify({
      success: true,
      message: '교사가 추가되었습니다',
      teacher: newTeacher,
      tempPassword: password
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Add teacher error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '교사 추가 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
