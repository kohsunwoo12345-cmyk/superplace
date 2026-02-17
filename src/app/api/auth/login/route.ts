export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// 임시 사용자 데이터 (프로덕션에서는 D1 Database 사용)
const users = [
  {
    id: 1,
    email: "admin@superplace.com",
    password: "admin1234", // 실제로는 bcrypt 해시 사용
    name: "관리자",
    role: "SUPER_ADMIN",
    academy_id: 1,
  },
  {
    id: 2,
    email: "director@superplace.com",
    password: "director1234",
    name: "원장",
    role: "DIRECTOR",
    academy_id: 1,
  },
  {
    id: 3,
    email: "teacher@superplace.com",
    password: "teacher1234",
    name: "강사",
    role: "TEACHER",
    academy_id: 1,
  },
  {
    id: 4,
    email: "test@test.com",
    password: "test1234",
    name: "테스트 사용자",
    role: "ADMIN",
    academy_id: 1,
  },
];

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

    // 사용자 찾기
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      console.log('❌ Login failed: Invalid credentials');
      return NextResponse.json(
        {
          success: false,
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 }
      );
    }

    // JWT 토큰 생성 (간단한 버전, 실제로는 jsonwebtoken 사용)
    const token = Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24시간
      })
    ).toString("base64");

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
          academy_id: user.academy_id,
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
