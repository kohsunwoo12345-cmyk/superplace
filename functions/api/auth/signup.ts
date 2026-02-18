// Cloudflare Pages Functions - 회원가입 API (D1 Database 사용)

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'DIRECTOR' | 'TEACHER' | 'STUDENT';
  academyName?: string;
  academyCode?: string;
}

interface Env {
  DB: D1Database;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate academy code
function generateAcademyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Simple password hashing using Web Crypto API (available in Cloudflare Workers)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'superplace-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function onRequestPost(context: any) {
  try {
    const data: SignupRequest = await context.request.json();
    
    console.log('📝 회원가입 시도:', { 
      email: data.email, 
      role: data.role,
      academyCode: data.academyCode,
      academyName: data.academyName,
      hasDB: !!context.env?.DB,
      envKeys: context.env ? Object.keys(context.env) : []
    });

    // D1 바인딩 확인
    if (!context.env?.DB) {
      console.error('❌ D1 데이터베이스 바인딩이 설정되지 않았습니다');
      return new Response(
        JSON.stringify({
          success: false,
          message: '데이터베이스 연결 오류입니다. 관리자에게 문의해주세요.',
          info: 'D1 binding not configured'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = context.env.DB;

    // 입력 검증
    if (!data.email || !data.password || !data.name || !data.role) {
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

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
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

    // 비밀번호 길이 검증
    if (data.password.length < 8) {
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

    // 역할별 필수 정보 검증
    if (data.role === 'DIRECTOR' && !data.academyName) {
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

    if ((data.role === 'TEACHER' || data.role === 'STUDENT') && !data.academyCode) {
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

    // 이메일 중복 확인
    const existingUser = await db
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(data.email)
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

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(data.password);
    const userId = generateId();
    let academyId: string | null = null;

    // 학원장인 경우 학원 생성
    if (data.role === 'DIRECTOR' && data.academyName) {
      academyId = generateId();
      const academyCode = generateAcademyCode();
      
      await db
        .prepare(`
          INSERT INTO Academy (id, name, code, createdAt, updatedAt)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `)
        .bind(academyId, data.academyName, academyCode)
        .run();

      console.log('✅ 학원 생성 완료:', { academyId, academyCode });
    }

    // 선생님/학생인 경우 학원 코드 확인
    if ((data.role === 'TEACHER' || data.role === 'STUDENT') && data.academyCode) {
      const academy = await db
        .prepare('SELECT id FROM Academy WHERE code = ?')
        .bind(data.academyCode)
        .first();

      if (!academy) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '유효하지 않은 학원 코드입니다',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      academyId = academy.id as string;
      console.log('✅ 학원 확인 완료:', { academyId });
    }

    // 사용자 생성
    await db
      .prepare(`
        INSERT INTO User (
          id, email, name, password, phone, role, academyId, 
          approved, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(
        userId,
        data.email,
        data.name,
        hashedPassword,
        data.phone || null,
        data.role,
        academyId,
        data.role === 'DIRECTOR' ? 1 : 0  // 학원장은 자동 승인
      )
      .run();

    console.log('✅ 회원가입 성공:', { userId, email: data.email, role: data.role });

    return new Response(
      JSON.stringify({
        success: true,
        message: data.role === 'DIRECTOR' 
          ? '회원가입이 완료되었습니다. 로그인하여 학원을 관리하세요.' 
          : data.role === 'STUDENT' || data.role === 'TEACHER'
          ? '회원가입이 완료되었습니다. 학원장 승인 후 이용하실 수 있습니다.'
          : '회원가입이 완료되었습니다.',
        data: {
          user: {
            id: userId,
            email: data.email,
            name: data.name,
            role: data.role,
            academyId: academyId,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ 회원가입 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
