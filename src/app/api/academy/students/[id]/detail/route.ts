import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    // 권한 체크
    if (role !== "SUPER_ADMIN" && role !== "DIRECTOR" && role !== "TEACHER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
        studentId: true,
        parentPhone: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        approved: true,
        createdAt: true,
        lastLoginAt: true,
        academy: {
          select: {
            name: true,
            code: true,
          },
        },
        enrolledClasses: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
          },
        },
        learningProgress: {
          select: {
            id: true,
            subject: true,
            progress: true,
            totalLessons: true,
            completedLessons: true,
            lastAccessedAt: true,
          },
          orderBy: {
            lastAccessedAt: "desc",
          },
        },
        assignments: {
          select: {
            id: true,
            title: true,
            subject: true,
            dueDate: true,
            status: true,
            score: true,
            submittedAt: true,
            material: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            dueDate: "desc",
          },
          take: 20,
        },
        testScores: {
          select: {
            id: true,
            subject: true,
            testName: true,
            testDate: true,
            score: true,
            maxScore: true,
            grade: true,
            rank: true,
          },
          orderBy: {
            testDate: "desc",
          },
          take: 20,
        },
        aiUsages: {
          select: {
            id: true,
            model: true,
            promptTokens: true,
            completionTokens: true,
            totalTokens: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
        _count: {
          select: {
            assignments: true,
            testScores: true,
            aiUsages: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 체크: DIRECTOR와 TEACHER는 자기 학원 학생만 조회 가능
    if (
      (role === "DIRECTOR" || role === "TEACHER") &&
      student.academy &&
      student.academy.code !== academyId
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("학생 상세 조회 실패:", error);
    return NextResponse.json(
      { error: "학생 상세 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
