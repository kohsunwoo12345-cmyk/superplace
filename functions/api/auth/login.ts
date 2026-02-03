// Cloudflare Pages Functions - 로그인 API (PostgreSQL)
import postgres from 'postgres';

interface Env {
  DATABASE_URL: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  let sql: any = null;
  
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

    // DATABASE_URL 확인
    if (!context.env || !context.env.DATABASE_URL) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'DATABASE_URL 환경 변수가 설정되지 않았습니다',
          error: 'DATABASE_URL not found. Please configure it in Cloudflare Pages settings.',
          instructions: {
            step1: 'Go to Cloudflare Dashboard',
            step2: 'Workers & Pages → superplacestudy → Settings → Environment variables',
            step3: 'Add variable: Name = DATABASE_URL, Value = your Neon PostgreSQL connection string',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // PostgreSQL 연결
    sql = postgres(context.env.DATABASE_URL, {
      ssl: 'require',
      max: 1,
    });

    // 사용자 조회
    const users = await sql`
      SELECT id, email, password, name, role, "academyId"
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      await sql.end();
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

    const user = users[0];

    // 비밀번호 검증 (평문 비교)
    if (user.password !== password) {
      await sql.end();
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
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      academyId: user.academyId,
    });

    await sql.end();

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
    
    // SQL 연결 정리
    if (sql) {
      try {
        await sql.end();
      } catch (e) {
        console.error('SQL cleanup error:', e);
      }
    }

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

// JWT 토큰 생성
async function generateToken(payload: any): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  const signature = btoa('simple-signature');

  return `${header}.${body}.${signature}`;
}
