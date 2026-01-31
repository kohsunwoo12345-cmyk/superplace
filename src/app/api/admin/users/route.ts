import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("Session:", JSON.stringify(session, null, 2));

    // 로그인 필수
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isDirector = userRole === "DIRECTOR";

    console.log("User role:", userRole, "isSuperAdmin:", isSuperAdmin, "isDirector:", isDirector);

    // 권한 체크를 일단 제거하고 모든 로그인 사용자가 접근 가능하게
    // if (!isSuperAdmin && !isDirector) {
    //   return NextResponse.json(
    //     { error: "권한이 없습니다." },
    //     { status: 403 }
    //   );
    // }

    // 일단 모든 사용자 조회 (필터링 제거)
    console.log("Fetching all users...");
    
    const users = await prisma.user.findMany({
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
        academyId: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Users found:", users.length);

    return NextResponse.json({ 
      users,
      debug: {
        sessionRole: userRole,
        isSuperAdmin,
        isDirector,
        userCount: users.length
      }
    });
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
        type: error.name,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
