import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

/**
 * POST /api/auth/student-code
 * 학생 코드로 로그인
 */
export async function POST(req: NextRequest) {
  try {
    const { studentCode } = await req.json();

    if (!studentCode || studentCode.length !== 5) {
      return NextResponse.json(
        { error: "5자리 학생 코드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 학생 코드로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { studentCode },
      include: {
        academy: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "유효하지 않은 학생 코드입니다." },
        { status: 404 }
      );
    }

    // 학생 계정인지 확인
    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "학생 계정만 코드 로그인이 가능합니다." },
        { status: 403 }
      );
    }

    // 승인 여부 확인
    if (!user.approved) {
      return NextResponse.json(
        { error: "승인되지 않은 계정입니다. 관리자에게 문의하세요." },
        { status: 403 }
      );
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // JWT 토큰 생성 (NextAuth와 호환)
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "your-secret-key"
    );

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      academyId: user.academyId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h") // 8시간 유효
      .sign(secret);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        academyId: user.academyId,
        academy: user.academy,
      },
      token,
    });
  } catch (error) {
    console.error("학생 코드 로그인 오류:", error);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
