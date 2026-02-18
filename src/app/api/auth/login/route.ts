export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/memory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt:', { email, hasPassword: !!password });

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일과 비밀번호를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    // 데이터베이스에서 사용자 찾기
    const user = db.findUserByEmail(email);

    if (!user || user.password !== password) {
      console.log('❌ Login failed: Invalid credentials');
      return NextResponse.json(
        {
          success: false,
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "비활성화된 계정입니다.",
        },
        { status: 403 }
      );
    }

    // 간단한 토큰 생성 (영문/숫자만)
    const token = `${user.id}.${user.email}.${user.role}.${Date.now()}`;

    console.log('✅ Login successful:', { userId: user.id, role: user.role });

    return NextResponse.json({
      success: true,
      message: "로그인 성공",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          academyId: user.academyId,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    console.error("💥 Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "로그인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// 로그아웃 (토큰 무효화는 클라이언트에서 처리)
export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "로그아웃 성공",
  });
}
