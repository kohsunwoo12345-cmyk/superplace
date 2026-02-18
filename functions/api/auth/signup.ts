// Cloudflare Pages Functions - 회원가입 API (간단 버전)

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export async function onRequestPost(context: { request: Request }) {
  try {
    const data: SignupRequest = await context.request.json();

    // 입력 검증
    if (!data.email || !data.password || !data.name) {
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

    // 간단한 성공 응답 (실제로는 DB에 저장해야 함)
    return new Response(
      JSON.stringify({
        success: true,
        message: '회원가입이 완료되었습니다',
        data: {
          user: {
            email: data.email,
            name: data.name,
            role: data.role || 'STUDENT',
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
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
