export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// 임시 회원가입 (실제로는 D1 Database 사용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    console.log('📝 Signup attempt:', { email, name, role });

    if (!email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "필수 정보를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    // 임시 응답 (실제로는 데이터베이스에 저장)
    console.log('✅ Signup successful (mock)');

    return NextResponse.json({
      success: true,
      message: "회원가입이 완료되었습니다. 로그인해주세요.",
      data: {
        user: {
          email,
          name,
          role: role || 'STUDENT',
        },
      },
    });
  } catch (error) {
    console.error("💥 Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "회원가입 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
