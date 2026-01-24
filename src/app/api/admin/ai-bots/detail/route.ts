import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 특정 봇의 상세 정보 조회 (할당 내역 포함)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // SUPER_ADMIN만 접근 가능
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Get bot ID from query params
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get("id");

    if (!botId) {
      return NextResponse.json(
        { error: "봇 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 봇 상세 정보 조회
    const bot = await prisma.aIBot.findUnique({
      where: { id: botId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "봇을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 할당 내역 조회
    const assignments = await prisma.botAssignment.findMany({
      where: {
        botId: bot.botId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            academy: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        grantedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        grantedAt: "desc",
      },
    });

    // 할당 통계
    const stats = {
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter(a => a.isActive).length,
      expiredAssignments: assignments.filter(
        a => a.expiresAt && new Date(a.expiresAt) < new Date()
      ).length,
      assignmentsByRole: {
        DIRECTOR: assignments.filter(a => a.user.role === "DIRECTOR").length,
        TEACHER: assignments.filter(a => a.user.role === "TEACHER").length,
        STUDENT: assignments.filter(a => a.user.role === "STUDENT").length,
      },
      assignmentsByAcademy: {} as Record<string, number>,
    };

    // 학원별 할당 통계
    assignments.forEach(assignment => {
      if (assignment.user.academy) {
        const academyName = assignment.user.academy.name;
        if (!stats.assignmentsByAcademy[academyName]) {
          stats.assignmentsByAcademy[academyName] = 0;
        }
        stats.assignmentsByAcademy[academyName]++;
      }
    });

    return NextResponse.json(
      {
        bot,
        assignments,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 봇 상세 정보 조회 오류:", error);
    return NextResponse.json(
      { error: "봇 상세 정보 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
