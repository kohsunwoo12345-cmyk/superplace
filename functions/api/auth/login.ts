// Cloudflare Pages Functions - 로그인 API (하드코딩 테스트 계정)

interface LoginRequest {
  email?: string;
  password: string;
}

// 테스트 계정
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

export async function onRequestPost(context: { request: Request }) {
  try {
    const data: LoginRequest = await context.request.json();

    console.log('🔐 로그인 시도:', { email: data.email });

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

    // 사용자 찾기
    const user = testUsers.find(
      (u) => u.email === data.email && u.password === data.password
    );

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

    // 간단한 토큰 생성
    const token = `${user.id}.${user.email}.${user.role}.${Date.now()}`;

    console.log('✅ 로그인 성공:', { userId: user.id, role: user.role });

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
