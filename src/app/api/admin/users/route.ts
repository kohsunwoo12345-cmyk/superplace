import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 로그인 필수 및 권한 체크 (SUPER_ADMIN 또는 DIRECTOR)
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isDirector = userRole === "DIRECTOR";

    if (!isSuperAdmin && !isDirector) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // SUPER_ADMIN은 모든 사용자 조회, DIRECTOR는 자기 학원 사용자만 조회
    const whereClause = isSuperAdmin 
      ? {} 
      : { academyId: session.user.academyId || null };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        approved: true,
        academy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("사용자 목록 조회 실패:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: "사용자 목록 조회 중 오류가 발생했습니다.",
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}
