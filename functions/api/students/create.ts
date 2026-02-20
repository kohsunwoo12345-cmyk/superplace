import { getUserFromAuth } from '../../_lib/auth';

interface Env {
  DB: D1Database;
}

// 한국 시간 생성
function getKoreanTime(): string {
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
async function hashPassword(password: string): Promise<string> {
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/students/create
 * 새 학생 생성
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    // 🔍 토큰에 academyId가 없으면 DB에서 조회
    if (!tokenAcademyId && userId) {
      console.log('🔍 academyId not in token, fetching from DB for user:', userId);
      try {
        const userRecord = await DB.prepare(`
          SELECT id, academyId, role 
          FROM users 
          WHERE id = ?
        `).bind(userId).first();
        
        if (userRecord) {
          tokenAcademyId = userRecord.academyId;
          console.log('✅ Found academyId from DB:', tokenAcademyId, 'for user:', userId);
        } else {
          console.error('❌ User not found in DB:', userId);
        }
      } catch (dbError: any) {
        console.error('❌ DB error fetching user:', dbError.message);
      }
    }

    console.log('👤 Final user info:', { userId, role, academyId: tokenAcademyId, email: userEmail });

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

    const body: any = await context.request.json();
    const { name, email, phone, password, school, grade, classIds } = body;

    console.log('📥 Received data:', { name, email, phone, school, grade, classIds: classIds?.length || 0 });

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
      .prepare('SELECT id FROM users WHERE phone = ?')
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
        .prepare('SELECT id FROM users WHERE email = ?')
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

    if (!academyId) {
      console.error('❌ No academy ID available');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // academyId를 정수로 변환
    const academyIdInt = typeof academyId === 'string' ? parseInt(academyId) : academyId;

    console.log('💾 Creating student...');
    console.log('📋 Student data:', {
      email: email || null,
      phone,
      name: name || null,
      school: school || null,
      grade: grade || null,
      academyId: academyIdInt,
      role: 'STUDENT'
    });

    try {
      // Step 1: users 테이블에 학생 계정 생성
      const userResult = await DB
        .prepare(`
          INSERT INTO users (
            email, phone, password, name, role, 
            academyId, createdAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          email || null,
          phone,
          hashedPassword,
          name || null,
          'STUDENT',
          academyIdInt,
          koreanTime
        )
        .run();

      const userId = userResult.meta.last_row_id;
      console.log('✅ User account created with ID:', userId);

      // Step 2: students 테이블에 학생 레코드 생성
      await DB
        .prepare(`
          INSERT INTO students (
            userId, academyId, grade, status, createdAt
          )
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          academyIdInt,
          grade || null,
          'ACTIVE',
          koreanTime
        )
        .run();

      console.log('✅ Student record created for userId:', userId);

      // Step 3: 반 배정 (선택사항)
      if (classIds && classIds.length > 0) {
        console.log('🏫 Assigning student to classes:', classIds);
        // 반 배정 로직은 별도로 처리 (여기서는 생략)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: '학생이 추가되었습니다',
          studentId: userId
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } catch (dbError: any) {
      console.error('❌ Database insert failed:', dbError);
      console.error('❌ Error details:', dbError.message);
      throw new Error(`데이터베이스 저장 실패: ${dbError.message}`);
    }

  } catch (error: any) {
    console.error('❌ Create student error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: '학생 추가 중 오류가 발생했습니다'
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
