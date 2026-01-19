import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 대상 사용자 조회
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        academyId: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // impersonate 정보를 포함한 세션 토큰 생성
    // 실제로는 NextAuth의 세션 메커니즘을 사용해야 하지만
    // 여기서는 간단하게 쿠키를 통해 전달
    const impersonateToken = sign(
      {
        userId: targetUser.id,
        impersonatedBy: session.user.id,
        timestamp: Date.now(),
      },
      process.env.NEXTAUTH_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // 응답에 쿠키 설정
    const response = NextResponse.json({ 
      success: true, 
      user: targetUser,
      message: "해당 사용자로 로그인되었습니다. 1시간 후 자동으로 원래 계정으로 돌아갑니다."
    });

    response.cookies.set("impersonate-token", impersonateToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1시간
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Impersonate 실패:", error);
    return NextResponse.json(
      { error: "계정 전환 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// impersonate 종료
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: "원래 계정으로 돌아왔습니다." });
  
  response.cookies.delete("impersonate-token");
  
  return response;
}
