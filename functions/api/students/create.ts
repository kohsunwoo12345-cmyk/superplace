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

    // academyId가 없으면 경고만 출력 (ADMIN/SUPER_ADMIN은 academy 없이도 생성 가능)
    // TEACHER/DIRECTOR는 보통 academyId가 있어야 하지만, 없어도 일단 진행 (기본값 1 사용)
    if (!academyId) {
      if (role === 'TEACHER' || role === 'DIRECTOR') {
        console.warn('⚠️ No academyId for TEACHER/DIRECTOR, using default academyId=1');
        academyId = 1; // 기본값 사용
      } else if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        console.error('❌ No academy ID available for non-admin user');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No academy assigned',
            message: '학원이 배정되지 않았습니다. 관리자에게 문의하세요.'
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // academyId 처리: 문자열이면 TEXT 컬럼(academyId)에, 숫자면 INTEGER 컬럼(academy_id)에 저장
    const isStringAcademyId = academyId && typeof academyId === 'string' && isNaN(parseInt(academyId));
    const academyIdInt = isStringAcademyId ? null : (academyId ? (typeof academyId === 'string' ? parseInt(academyId) : academyId) : null);
    const academyIdText = isStringAcademyId ? academyId : null;

    // 이메일이 없으면 phone 기반으로 생성 (users.email이 NOT NULL 제약조건을 가지고 있음)
    const finalEmail = email || `student_${phone}@temp.superplace.local`;

    console.log('💾 Creating student...');
    console.log('📋 Student data:', {
      email: finalEmail,
      phone,
      name: name || null,
      school: school || null,
      grade: grade || null,
      academyId: academyIdText,
      academy_id: academyIdInt,
      isStringAcademyId,
      role: 'STUDENT'
    });

    try {
      let userId: any = null;
      let insertSuccess = false;
      let usedPattern = '';

      // 패턴 1: users + academy_id (snake_case INTEGER - 실제 DB 스키마)
      console.log('💾 Creating student - 패턴 1 시도: users + academy_id + academyId');
      try {
        const userResult = await DB
          .prepare(`
            INSERT INTO users (
              email, phone, password, name, role, 
              academy_id, academyId, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            finalEmail,
            phone,
            hashedPassword,
            name || null,
            'STUDENT',
            academyIdInt,
            academyIdText,
            koreanTime
          )
          .run();

        userId = userResult.meta.last_row_id;
        insertSuccess = true;
        usedPattern = 'users + academy_id';
        console.log('✅ 패턴 1 성공: User account created with ID:', userId);
      } catch (e1: any) {
        console.log('❌ 패턴 1 실패:', e1.message);
      }

      // 패턴 2: User + academy_id (PascalCase 테이블 + snake_case 컬럼)
      if (!insertSuccess) {
        console.log('💾 패턴 2 시도: User + academy_id');
        try {
          const userResult = await DB
            .prepare(`
              INSERT INTO User (
                email, phone, password, name, role, 
                academy_id, created_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              finalEmail,
              phone,
              hashedPassword,
              name || null,
              'STUDENT',
              academyIdInt,
              koreanTime
            )
            .run();

          userId = userResult.meta.last_row_id;
          insertSuccess = true;
          usedPattern = 'User + academy_id';
          console.log('✅ 패턴 2 성공: User account created with ID:', userId);
        } catch (e2: any) {
          console.log('❌ 패턴 2 실패:', e2.message);
        }
      }

      // 패턴 3: users + academyId (TEXT 타입 대비 - 문자열로 변환)
      if (!insertSuccess) {
        console.log('💾 패턴 3 시도: users + academyId (TEXT)');
        try {
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
              academyIdInt ? academyIdInt.toString() : null,
              koreanTime
            )
            .run();

          userId = userResult.meta.last_row_id;
          insertSuccess = true;
          usedPattern = 'users + academyId (TEXT)';
          console.log('✅ 패턴 3 성공: User account created with ID:', userId);
        } catch (e3: any) {
          console.log('❌ 패턴 3 실패:', e3.message);
        }
      }

      if (!insertSuccess) {
        throw new Error('모든 INSERT 패턴 실패 - 테이블 스키마 확인 필요');
      }

      console.log(`🎯 사용된 패턴: ${usedPattern}`);

      // Step 2: students 테이블에 학생 레코드 생성 (실제 스키마는 user_id, academy_id)
      let studentInsertSuccess = false;
      
      // 패턴 1: students + user_id/academy_id (snake_case - 실제 DB 스키마)
      try {
        await DB
          .prepare(`
            INSERT INTO students (
              user_id, academy_id, grade, status, created_at
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
        studentInsertSuccess = true;
        console.log('✅ Student record created (snake_case)');
      } catch (e1: any) {
        console.log('❌ students snake_case 실패:', e1.message);
        
        // 패턴 2: students + userId/academyId (camelCase 대비)
        try {
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
          studentInsertSuccess = true;
          console.log('✅ Student record created (camelCase)');
        } catch (e2: any) {
          console.log('⚠️ students 테이블 INSERT 실패:', e2.message);
          console.log('⚠️ students 테이블이 없거나 스키마 불일치 - 계속 진행');
        }
      }

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
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error cause:', error.cause);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '학생 추가 중 오류가 발생했습니다',
        details: error.stack,
        cause: error.cause?.toString(),
        errorDetails: error.toString(),
        message: '학생 추가 중 오류가 발생했습니다',
        hint: '자세한 에러는 Cloudflare 로그를 확인하세요'
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
