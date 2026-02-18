// Cloudflare Pages Functions - 로그인 API (D1 Database 사용)

interface LoginRequest {
  email: string;
  password: string;
}

interface Env {
  DB: D1Database;
}

// Simple password hashing using Web Crypto API (same as signup)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'superplace-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 하드코딩된 테스트 계정 (fallback)
const testUsers = [
  {
    id: '1',
    email: 'admin@superplace.com',
    password: 'admin1234',
    name: '슈퍼플레이스 관리자',
    role: 'SUPER_ADMIN',
    academyId: null,
  },
  {
    id: '2',
    email: 'director@superplace.com',
    password: 'director1234',
    name: '원장',
    role: 'DIRECTOR',
    academyId: null,
  },
  {
    id: '3',
    email: 'teacher@superplace.com',
    password: 'teacher1234',
    name: '김선생',
    role: 'TEACHER',
    academyId: null,
  },
  {
    id: '4',
    email: 'test@test.com',
    password: 'test1234',
    name: '테스트',
    role: 'ADMIN',
    academyId: null,
  },
];

export async function onRequestPost(context: any) {
  try {
    const data: LoginRequest = await context.request.json();

    console.log('🔐 로그인 시도:', { 
      email: data.email,
      hasDB: !!context.env?.DB,
      envKeys: context.env ? Object.keys(context.env) : []
    });

    // 입력 검증
    if (!data.email || !data.password) {
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

    // 1. 데이터베이스에서 사용자 찾기 (우선)
    const db = context.env?.DB;
    
    if (db) {
      try {
        const hashedPassword = await hashPassword(data.password);
        
        const user = await db
          .prepare(`
            SELECT id, email, name, role, academyId, approved 
            FROM User 
            WHERE email = ? AND password = ?
          `)
          .bind(data.email, hashedPassword)
          .first();

        if (user) {
          // 승인 여부 확인 (학원장은 자동 승인)
          if (user.approved === 0 && user.role !== 'DIRECTOR') {
            return new Response(
              JSON.stringify({
                success: false,
                message: '아직 학원장의 승인이 완료되지 않았습니다. 학원장에게 문의해주세요.',
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }

          // 마지막 로그인 시간 업데이트
          await db
            .prepare(`UPDATE User SET lastLoginAt = datetime('now') WHERE id = ?`)
            .bind(user.id)
            .run();

          // 토큰 생성
          const token = `${user.id}|${user.email}|${user.role}|${Date.now()}`;

          console.log('✅ DB 로그인 성공:', { userId: user.id, role: user.role });

          return new Response(
            JSON.stringify({
              success: true,
              message: '로그인 성공',
              data: {
                token,
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  academyId: user.academyId,
                },
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (dbError) {
        console.error('DB 로그인 오류 (fallback to test users):', dbError);
      }
    }

    // 2. 하드코딩된 테스트 계정으로 fallback
    const testUser = testUsers.find(
      (u) => u.email === data.email && u.password === data.password
    );

    if (testUser) {
      const token = `${testUser.id}|${testUser.email}|${testUser.role}|${Date.now()}`;

      console.log('✅ 테스트 계정 로그인 성공:', { userId: testUser.id, role: testUser.role });

      return new Response(
        JSON.stringify({
          success: true,
          message: '로그인 성공 (테스트 계정)',
          data: {
            token,
            user: {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
              academyId: testUser.academyId,
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. 인증 실패
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
  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '로그인 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
