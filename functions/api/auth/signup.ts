// Cloudflare Pages Functions - 회원가입 API (비활성화)
interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  academyName?: string;
  academyCode?: string;
  phone?: string;
}

export async function onRequestPost(context: { request: Request }) {
  try {
    const data: SignupRequest = await context.request.json();

    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입은 현재 지원하지 않습니다',
        info: '기존 계정으로 로그인해주세요',
        instructions: {
          message: '이 사이트는 https://superplace-academy.pages.dev/ 와 동일한 데이터베이스를 사용합니다.',
          action: '기존 계정으로 로그인하거나, 관리자에게 문의하세요.',
          contact: '010-8739-9697',
        },
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입은 현재 지원하지 않습니다',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
