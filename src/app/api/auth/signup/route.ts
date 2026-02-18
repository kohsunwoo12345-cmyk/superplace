import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 간단한 검증
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json(
        {
          success: false,
          message: '필수 정보를 모두 입력해주세요',
        },
        { status: 400 }
      );
    }

    // 실제로는 데이터베이스에 저장해야 하지만, 지금은 성공 응답만 반환
    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: {
        user: {
          email: data.email,
          name: data.name,
          role: data.role || 'STUDENT',
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: '회원가입 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
