// Cloudflare Pages Function - Student Create API
// Converted from TypeScript for Cloudflare Pages compatibility

// 인라인 토큰 디코딩 함수
function decodeToken(token) {
  try {
    let parts = token.split('|');
    
    if (parts.length === 5) {
      const [userId, email, role, academyId, timestamp] = parts;
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const tokenAge = now - tokenTime;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (tokenAge > maxAge) {
        throw new Error('Token expired');
      }
      
      return { userId, id: userId, email, role, academyId: academyId || null, timestamp: tokenTime };
    }
    
    if (parts.length === 4) {
      const [userId, email, role, timestamp] = parts;
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const tokenAge = now - tokenTime;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (tokenAge > maxAge) {
        throw new Error('Token expired');
      }
      
      return { userId, id: userId, email, role, academyId: null, timestamp: tokenTime };
    }
    
    throw new Error('Invalid token format');
  } catch (error) {
    return null;
  }
}

function getUserFromAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return decodeToken(token);
}

// 한국 시간 생성
function getKoreanTime() {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Hash password using SHA-256
async function hashPassword(password) {
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 6자리 숫자 출석 코드 생성
function generateAttendanceCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * POST /api/students/create
 * 새 학생 생성 (학원장/교사용)
 */
export async function onRequestPost(context) {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📝 Create student API called');

    // 🔒 보안 강화: Authorization 헤더에서 사용자 정보 추출
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      console.error('❌ create: Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = userPayload.userId || userPayload.id;
    const role = userPayload.role?.toUpperCase();
    let tokenAcademyId = userPayload.academyId;
    const userEmail = userPayload.email;

    console.log('👤 Authenticated user:', { userId, role, academyId: tokenAcademyId, email: userEmail });

    // 권한 확인
    if (role !== 'DIRECTOR' && role !== 'TEACHER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Insufficient permissions',
          message: '학생을 추가할 권한이 없습니다'
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json();
    const { name, email, phone, password } = body;

    console.log('📥 Received data:', { name, email, phone });

    // 필수 필드 검증
    if (!phone || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
          message: '연락처와 비밀번호는 필수입니다'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password too short',
          message: '비밀번호는 최소 6자 이상이어야 합니다'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 연락처 중복 확인
    const existingPhone = await DB
      .prepare('SELECT id FROM User WHERE phone = ?')
      .bind(phone)
      .first();

    if (existingPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Phone already exists',
          message: '이미 등록된 연락처입니다'
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일 중복 확인 (이메일이 제공된 경우)
    if (email) {
      const existingEmail = await DB
        .prepare('SELECT id FROM User WHERE email = ?')
        .bind(email)
        .first();

      if (existingEmail) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email already exists',
            message: '이미 등록된 이메일입니다'
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);
    const koreanTime = getKoreanTime();

    // 학원장/선생님은 자신의 academy_id 사용, 관리자는 body에서 받은 academy_id 사용
    let academyId = tokenAcademyId;
    
    if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && body.academyId) {
      academyId = body.academyId;
    }

    console.log('🔍 Academy assignment:', { 
      userRole: role, 
      tokenAcademyId, 
      bodyAcademyId: body.academyId,
      finalAcademyId: academyId 
    });

    // academyId 처리: 문자열 ID 지원 (academy-xxx 형식)
    let finalAcademyId = null;
    if (academyId) {
      if (typeof academyId === 'number') {
        finalAcademyId = Math.floor(academyId);  // 실수면 정수로 변환
      } else if (typeof academyId === 'string') {
        // 문자열 ID (예: "academy-xxx")는 그대로 유지
        // 숫자 문자열 (예: "123")은 정수로 변환
        const parsed = parseInt(academyId);
        if (!isNaN(parsed) && String(parsed) === academyId) {
          finalAcademyId = parsed;  // 순수 숫자 문자열
        } else {
          finalAcademyId = academyId;  // 문자열 ID 그대로 유지
        }
      }
    }
    
    console.log('🔍 Academy ID processing:', { 
      original: academyId, 
      type: typeof academyId,
      final: finalAcademyId,
      finalType: typeof finalAcademyId
    });

    // 이메일이 없으면 phone 기반으로 생성
    const finalEmail = email || `student_${phone}@temp.superplace.local`;

    console.log('💾 Creating student...');
    console.log('📋 Student data:', {
      email: finalEmail,
      phone,
      name: name || null,
      academyId: finalAcademyId,
      role: 'STUDENT'
    });

    try {
      // 🎯 User 테이블 사용
      console.log('💾 Creating student in User table...');
      
      // 고유한 학생 ID 생성
      const studentId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // academyId를 문자열로 변환하여 저장 (문자열 ID 지원)
      const academyIdForDb = finalAcademyId !== null ? String(finalAcademyId) : null;
      
      const userResult = await DB
        .prepare(`
          INSERT INTO User (
            id, email, phone, password, name, role, 
            academyId, approved, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `)
        .bind(
          studentId,
          finalEmail,
          phone,
          hashedPassword,
          name || null,
          'STUDENT',
          academyIdForDb,
          koreanTime,
          koreanTime
        )
        .run();

      const userId = studentId;
      console.log('✅ User account created with ID:', userId);

      // Step 2: 출석 코드 자동 생성
      let attendanceCode = null;
      try {
        console.log('🎫 Generating attendance code for student:', userId);
        
        // 출석 코드 테이블 생성 (없는 경우)
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS student_attendance_codes (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            academyId TEXT,
            classId TEXT,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT (datetime('now')),
            expiresAt TEXT
          )
        `).run();

        // 6자리 숫자 코드 생성 (중복 체크)
        let code = generateAttendanceCode();
        let attempts = 0;
        while (attempts < 20) {
          const existing = await DB.prepare(
            "SELECT id FROM student_attendance_codes WHERE code = ?"
          ).bind(code).first();
          
          if (!existing) {
            break;
          }
          code = generateAttendanceCode();
          attempts++;
        }

        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await DB.prepare(`
          INSERT INTO student_attendance_codes (
            id, userId, code, academyId, isActive, createdAt
          )
          VALUES (?, ?, ?, ?, 1, ?)
        `).bind(
          codeId,
          userId,
          code,
          academyIdForDb,
          koreanTime
        ).run();

        attendanceCode = code;
        console.log('✅ Attendance code created:', attendanceCode);
      } catch (codeError) {
        console.error('⚠️ Attendance code generation failed:', codeError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `학생이 추가되었습니다. 출석 코드: ${attendanceCode}`,
          studentId: userId,
          attendanceCode: attendanceCode,
          passwordInfo: `⚠️ 비밀번호: ${password}`
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error('❌ Create student error:', error);
      throw error;
    }
  } catch (error) {
    console.error("❌ Create student API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create student",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
