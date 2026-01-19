import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    // SUPER_ADMIN, DIRECTOR, TEACHER만 학생 목록 조회 가능
    if (role !== "SUPER_ADMIN" && role !== "DIRECTOR" && role !== "TEACHER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const whereClause: any = {
      role: "STUDENT",
    };

    // DIRECTOR와 TEACHER는 자기 학원 학생만 조회
    if (role === "DIRECTOR" || role === "TEACHER") {
      whereClause.academyId = academyId;
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
        studentId: true,
        parentPhone: true,
        approved: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        createdAt: true,
        lastLoginAt: true,
        academy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        enrolledClasses: {
          select: {
            id: true,
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
            testScores: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("학생 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "학생 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
