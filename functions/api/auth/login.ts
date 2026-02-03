// Cloudflare Pages Functions - 로그인 API (D1)
interface Env {
  DB: D1Database;
}

interface LoginRequest {
  email: string;
  password: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { email, password }: LoginRequest = await context.request.json();

    // 입력 검증
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일과 비밀번호를 입력해주세요',
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
          message: 'D1 데이터베이스 바인딩이 설정되지 않았습니다',
          error: 'DB binding not found. Please configure D1 binding in Cloudflare Pages settings.',
          instructions: {
            step1: 'Go to Cloudflare Dashboard',
            step2: 'Workers & Pages → superplacestudy → Settings → Functions',
            step3: 'Add D1 binding: Variable name = DB, Database = (same as superplace-academy)',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 사용자 조회 (D1 테이블 이름: User)
    const user = await context.env.DB.prepare(
      'SELECT id, email, password, name, role, academyId FROM User WHERE email = ?'
    )
      .bind(email)
      .first();

    if (!user) {
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

    // 비밀번호 검증 (평문 비교)
    if (user.password !== password) {
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

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      academyId: user.academyId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: '로그인 성공',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            academyId: user.academyId,
          },
          token,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    
    // 더 상세한 에러 정보
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      hasDB: !!context.env?.DB,
      timestamp: new Date().toISOString(),
    };
    
    return new Response(
      JSON.stringify({
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다',
        error: errorDetails.message,
        debug: errorDetails,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// JWT 토큰 생성
function generateToken(payload: any): string {
  try {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const body = btoa(JSON.stringify({ 
      ...payload, 
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) 
    }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const signature = btoa('simple-signature')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${header}.${body}.${signature}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}
// Force redeploy Tue Feb  3 10:15:00 UTC 2026
