// Cloudflare Pages Functions - 로그인 API
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
            step3: 'Add D1 binding: Variable name = DB, Database = superplace-db',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 사용자 조회
    const user = await context.env.DB.prepare(
      'SELECT id, email, password, name, role, academyId FROM users WHERE email = ?'
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

    // 비밀번호 검증 (bcrypt 대신 단순 비교 - Cloudflare Workers에서는 bcrypt가 제한적)
    // 실제 프로덕션에서는 bcryptjs 또는 Web Crypto API 사용
    const isPasswordValid = await verifyPassword(password, user.password as string);

    if (!isPasswordValid) {
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

    // JWT 토큰 생성 (단순화된 버전)
    const token = await generateToken({
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
    return new Response(
      JSON.stringify({
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 비밀번호 검증 함수 (평문 비교 - 개발 단계)
async function verifyPassword(
  plainPassword: string,
  storedPassword: string
): Promise<boolean> {
  // 개발 단계: 평문 비교
  // 프로덕션에서는 bcrypt 또는 Web Crypto API 사용 필요
  return plainPassword === storedPassword;
}

// JWT 토큰 생성 (단순화된 버전)
async function generateToken(payload: any): Promise<string> {
  // 실제 프로덕션에서는 jose 라이브러리 또는 Web Crypto API 사용
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  const signature = btoa('simple-signature'); // 실제로는 HMAC 서명 필요

  return `${header}.${body}.${signature}`;
}
