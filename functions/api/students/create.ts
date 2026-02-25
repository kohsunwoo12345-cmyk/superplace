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

// 6자리 숫자 출석 코드 생성
function generateAttendanceCode(): string {
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
          FROM User 
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

    // academyId 유효성 체크는 제거 - 어떤 형태든 허용
    // ADMIN/SUPER_ADMIN은 academy 없이도 생성 가능
    // TEACHER/DIRECTOR는 토큰에서 가져온 academyId 사용 (문자열 또는 숫자)

    // academyId 처리: 항상 정수로 변환
    let finalAcademyId: number | null = null;
    if (academyId) {
      if (typeof academyId === 'number') {
        finalAcademyId = Math.floor(academyId);  // 실수면 정수로 변환
      } else if (typeof academyId === 'string') {
        const parsed = parseInt(academyId);
        finalAcademyId = isNaN(parsed) ? null : parsed;
      }
    }
    
    console.log('🔍 Academy ID processing:', { 
      original: academyId, 
      type: typeof academyId,
      final: finalAcademyId,
      finalType: typeof finalAcademyId
    });

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
      // 🎯 User 테이블 사용 (관리자 API와 동일)
      console.log('💾 Creating student in User table...');
      
      // 고유한 학생 ID 생성
      const studentId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📋 Student data:', {
        id: studentId,
        email: finalEmail,
        phone,
        name: name || null,
        academyId: finalAcademyId,
        role: 'STUDENT'
      });

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
          finalAcademyId,
          koreanTime,
          koreanTime
        )
        .run();

      const userId = studentId;  // 생성한 문자열 ID 사용
      console.log('✅ User account created with ID:', userId);

      // Step 2: 출석 코드 자동 생성 (중요!)
      let attendanceCode = null;
      try {
        console.log('🎫 Generating attendance code for student:', userId);
        
        // 출석 코드 테이블 생성 (없는 경우)
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS student_attendance_codes (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            academyId INTEGER,
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
          
          if (!existing) break;
          code = generateAttendanceCode();
          attempts++;
        }

        // 출석 코드 저장
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await DB.prepare(`
          INSERT INTO student_attendance_codes (id, userId, code, academyId, isActive, createdAt)
          VALUES (?, ?, ?, ?, 1, ?)
        `).bind(codeId, userId.toString(), code, finalAcademyId || null, koreanTime).run();

        attendanceCode = code;
        console.log('✅ Attendance code generated:', code);
      } catch (codeError: any) {
        console.error('❌ Failed to generate attendance code:', codeError.message);
        console.error('⚠️ Student created but without attendance code');
      }

      // Step 3: 반 배정 (선택사항)
      if (classIds && classIds.length > 0) {
        console.log('🏫 Assigning student to classes:', classIds);
        
        // 여러 패턴 시도하여 반 배정
        for (const classId of classIds) {
          let classAssignSuccess = false;
          
          // 패턴 1: ClassStudent 테이블 (PascalCase)
          try {
            await DB
              .prepare(`
                INSERT INTO ClassStudent (studentId, classId, enrolledAt)
                VALUES (?, ?, ?)
              `)
              .bind(userId, classId, koreanTime)
              .run();
            classAssignSuccess = true;
            console.log(`✅ Class assignment success (ClassStudent): classId=${classId}`);
          } catch (e1: any) {
            console.log(`❌ ClassStudent 패턴 실패 (classId=${classId}):`, e1.message);
          }
          
          // 패턴 2: class_students 테이블 (snake_case)
          if (!classAssignSuccess) {
            try {
              await DB
                .prepare(`
                  INSERT INTO class_students (student_id, class_id, enrolled_at)
                  VALUES (?, ?, ?)
                `)
                .bind(userId, classId, koreanTime)
                .run();
              classAssignSuccess = true;
              console.log(`✅ Class assignment success (class_students): classId=${classId}`);
            } catch (e2: any) {
              console.log(`❌ class_students 패턴 실패 (classId=${classId}):`, e2.message);
            }
          }
          
          // 패턴 3: ClassStudents 테이블 (복수형)
          if (!classAssignSuccess) {
            try {
              await DB
                .prepare(`
                  INSERT INTO ClassStudents (studentId, classId, enrolledAt)
                  VALUES (?, ?, ?)
                `)
                .bind(userId, classId, koreanTime)
                .run();
              classAssignSuccess = true;
              console.log(`✅ Class assignment success (ClassStudents): classId=${classId}`);
            } catch (e3: any) {
              console.log(`❌ ClassStudents 패턴 실패 (classId=${classId}):`, e3.message);
              console.log(`⚠️ 반 배정 테이블이 없거나 스키마 불일치 - classId=${classId} 배정 실패`);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: attendanceCode 
            ? `학생이 추가되었습니다. 출석 코드: ${attendanceCode}` 
            : '학생이 추가되었습니다',
          studentId: userId,
          attendanceCode: attendanceCode,
          passwordInfo: `⚠️ 비밀번호: ${password}`
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
