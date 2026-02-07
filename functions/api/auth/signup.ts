// Cloudflare Pages Functions - 회원가입 API (D1)
interface Env {
  DB: D1Database;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  academyName?: string;
  academyCode?: string;
  academyId?: string | number; // 학원장이 학생 추가 시 직접 전달
  phone?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const data: SignupRequest = await context.request.json();

    // 역할 설정 (검증 전에 먼저 확인)
    let userRole = data.role || 'STUDENT';
    if (userRole === 'member') {
      userRole = 'DIRECTOR';
    } else if (userRole === 'user') {
      userRole = 'TEACHER';
    }

    // 입력 검증 - 학생은 전화번호 필수, 이메일 선택
    if (!data.name || !data.password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이름과 비밀번호는 필수입니다',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 학생: 전화번호 필수, 이메일 선택
    // 원장/선생님/관리자: 이메일 필수
    if (userRole === 'STUDENT') {
      if (!data.phone || !data.phone.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '학생은 전화번호가 필수입니다',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      if (!data.email || !data.email.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '원장/선생님/관리자는 이메일이 필수입니다',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // D1 바인딩 확인
    if (!context.env || !context.env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'D1 데이터베이스 연결 실패',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 중복 체크 - 이메일이 있으면 이메일로, 학생은 전화번호로
    if (data.email && data.email.trim()) {
      const existingEmail = await context.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      )
        .bind(data.email)
        .first();

      if (existingEmail) {
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
    }

    // 학생: 전화번호 중복 체크
    if (userRole === 'STUDENT' && data.phone) {
      const existingPhone = await context.env.DB.prepare(
        'SELECT id FROM users WHERE phone = ? AND role = ?'
      )
        .bind(data.phone, 'STUDENT')
        .first();

      if (existingPhone) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '이미 사용 중인 전화번호입니다',
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 역할 매핑 (이미 위에서 처리했으므로 제거)
    } else if (userRole === 'user') {
      userRole = 'TEACHER'; // 선생님
    }
    // ADMIN, SUPER_ADMIN, DIRECTOR, TEACHER, STUDENT는 그대로 유지

    // academyId 설정
    let academyId: string | number | null = null;
    
    // 1순위: 요청에서 직접 전달된 academyId (학원장이 학생 추가 시)
    if (data.academyId) {
      academyId = data.academyId;
      console.log(`✅ Using provided academyId: ${academyId} for ${data.name}`);
    }
    // 2순위: academyName으로 조회/생성
    else if (data.academyName) {
      console.log(`📋 Looking up academy: ${data.academyName}`);
      try {
        // 학원 조회
        const academy = await context.env.DB.prepare(
          `SELECT id FROM academy WHERE name = ?`
        ).bind(data.academyName).first();
        
        if (academy) {
          // ID를 문자열로 유지 (academy.id가 문자열 또는 숫자일 수 있음)
          academyId = academy.id;
          console.log(`✅ Found academy - ID: ${academyId}, Name: ${data.academyName}`);
        } else {
          // 학원 생성 - 새로운 academy는 자동 증가 정수 ID 사용
          console.log(`📝 Creating new academy: ${data.academyName}`);
          
          // 새 academy ID 생성 (기존 최대 숫자 ID + 1)
          const maxIdResult = await context.env.DB.prepare(
            `SELECT MAX(CAST(id AS INTEGER)) as maxId FROM academy WHERE id GLOB '[0-9]*'`
          ).first();
          
          const nextId = maxIdResult && maxIdResult.maxId ? Number(maxIdResult.maxId) + 1 : 1001;
          console.log(`📊 Next academy ID: ${nextId}`);
          
          await context.env.DB.prepare(
            `INSERT INTO academy (id, name, code, description, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
          ).bind(
            String(nextId),
            data.academyName,
            `AC${String(nextId).padStart(6, '0')}`,
            `${data.academyName} - 스마트 학원 관리 시스템`,
            'FREE',
            100,
            10,
            1
          ).run();
          
          academyId = String(nextId);
          console.log(`✅ Created new academy - ID: ${academyId}, Name: ${data.academyName}`);
        }
      } catch (academyError) {
        console.error('❌ Academy lookup/creation failed:', academyError);
        // academyId는 null로 유지
      }
    } else {
      console.log(`⚠️  No academyName provided for ${data.name}`);
    }
    
    console.log(`📊 Final academyId before user creation: ${academyId} for ${data.name}`);

    // 사용자 생성 (이메일은 선택사항, 학생은 전화번호 필수)
    const result = await context.env.DB.prepare(
      `INSERT INTO users (email, password, name, role, phone, academyId)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        data.email || null, // 이메일 선택사항 (학생은 null 가능)
        data.password,
        data.name,
        userRole,
        data.phone || null,
        academyId
      )
      .run();
    
    // 생성된 사용자 ID 가져오기
    const userId = result.meta.last_row_id;

    // 학생인 경우 자동으로 출석 코드 생성 (attendance_code 컬럼 사용)
    let attendanceCode = null;
    if (userRole.toUpperCase() === 'STUDENT') {
      try {
        // 6자리 숫자 코드 생성 (중복 체크)
        let code = '';
        let attempts = 0;
        while (attempts < 20) {
          code = Math.floor(100000 + Math.random() * 900000).toString();

          // attendance_code 컬럼에서 중복 체크 (컬럼이 있는 경우만)
          try {
            const existing = await context.env.DB.prepare(
              "SELECT id FROM users WHERE attendance_code = ?"
            ).bind(code).first();
            
            if (!existing) break;
          } catch (e) {
            // attendance_code 컬럼이 없으면 그냥 사용
            break;
          }
          attempts++;
        }

        // attendance_code 컬럼이 있으면 업데이트
        try {
          await context.env.DB.prepare(`
            UPDATE users SET attendance_code = ? WHERE id = ?
          `).bind(code, userId).run();

          attendanceCode = code;
          console.log(`✅ Generated attendance code ${code} for student ${userId}`);
        } catch (e) {
          console.log('⚠️  attendance_code column not found, skipping code generation');
        }
      } catch (codeError) {
        console.error('Failed to generate attendance code:', codeError);
        // 코드 생성 실패해도 회원가입은 성공
      }
    }

    // JWT 토큰 생성
    const token = generateToken({
      id: userId,
      email: data.email,
      name: data.name,
      role: userRole,
    });

    console.log(`📤 Signup response - userId: ${userId}, academyId: ${academyId}, role: ${userRole}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '회원가입 성공',
        attendanceCode: attendanceCode, // 학생인 경우 출석 코드 반환
        user: {
          id: userId,
          email: data.email,
          name: data.name,
          role: userRole,
          academyId: academyId,
        },
        token,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입 처리 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// JWT 토큰 생성 (Unicode 안전)
function generateToken(payload: any): string {
  try {
    // Unicode 문자를 안전하게 base64로 인코딩하는 헬퍼 함수
    const base64UrlEncode = (str: string): string => {
      // UTF-8로 인코딩한 후 base64로 변환
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      
      // Uint8Array를 바이너리 문자열로 변환
      let binary = '';
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }
      
      // Base64로 인코딩하고 URL-safe로 변환
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };
    
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64UrlEncode(JSON.stringify({ 
      ...payload, 
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) 
    }));
    const signature = base64UrlEncode('simple-signature');

    return `${header}.${body}.${signature}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}
