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
  phone?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const data: SignupRequest = await context.request.json();

    // 입력 검증
    if (!data.name || !data.email || !data.password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '모든 필수 항목을 입력해주세요',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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

    // 이메일 중복 체크
    const existingUser = await context.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    )
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

    // 사용자 ID 생성
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 역할 설정 (기본값: STUDENT)
    const userRole = data.role || 'STUDENT';

    // 사용자 생성
    await context.env.DB.prepare(
      `INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        userId,
        data.email,
        data.password, // 실제로는 해시해야 하지만 기존 DB가 평문이므로
        data.name,
        userRole,
        data.phone || '',
        null // academyId는 나중에 설정
      )
      .run();

    // JWT 토큰 생성
    const token = generateToken({
      id: userId,
      email: data.email,
      name: data.name,
      role: userRole,
      academyId: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: '회원가입 성공',
        data: {
          user: {
            id: userId,
            email: data.email,
            name: data.name,
            role: userRole,
          },
          token,
        },
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
