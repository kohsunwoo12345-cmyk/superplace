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

    // 사용자 조회 (모든 컬럼 조회)
    const user = await context.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
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
    const loginSuccess = user.password === password;
    
    // IP 주소 가져오기
    const ip = context.request.headers.get("CF-Connecting-IP") || 
               context.request.headers.get("X-Forwarded-For") || 
               "unknown";
    
    // User Agent 가져오기
    const userAgent = context.request.headers.get("User-Agent") || "unknown";

    // 로그인 기록 저장
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      // 로그인 로그 테이블이 없으면 생성
      await context.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_login_logs (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          ip TEXT NOT NULL,
          userAgent TEXT,
          success INTEGER DEFAULT 1,
          loginAt TEXT DEFAULT (datetime('now'))
        )
      `).run();

      // 로그인 시도 기록
      await context.env.DB.prepare(`
        INSERT INTO user_login_logs (id, userId, ip, userAgent, success, loginAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(logId, String(user.id), ip, userAgent, loginSuccess ? 1 : 0).run();

      // 로그인 성공 시 lastLoginAt, lastLoginIp 업데이트
      if (loginSuccess) {
        await context.env.DB.prepare(`
          UPDATE users 
          SET lastLoginAt = datetime('now'), lastLoginIp = ?
          WHERE id = ?
        `).bind(ip, user.id).run();
      }
    } catch (logError) {
      console.error("Failed to log login attempt:", logError);
      // 로그 실패는 무시하고 계속 진행
    }

    if (!loginSuccess) {
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
      academyId: user.academyId || null,
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
            academyId: user.academyId || null,
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
// Force redeploy Tue Feb  3 10:15:00 UTC 2026
