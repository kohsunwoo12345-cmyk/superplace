import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/learning/records
 * 학생 학습 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId, id: userId } = session.user;

    // 학생 ID (쿼리 파라미터 또는 본인)
    const { searchParams } = new URL(request.url);
    const targetStudentId = searchParams.get("studentId") || userId;

    // 권한 확인
    if (role === "STUDENT" && targetStudentId !== userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (
      role === "TEACHER" ||
      role === "DIRECTOR"
    ) {
      // 같은 학원 학생인지 확인
      const targetStudent = await prisma.user.findUnique({
        where: { id: targetStudentId },
        select: { academyId: true },
      });

      if (targetStudent?.academyId !== academyId) {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    // 학생 정보
    const student = await prisma.user.findUnique({
      where: { id: targetStudentId },
      select: {
        id: true,
        name: true,
        email: true,
        studentCode: true,
        grade: true,
        academyId: true,
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!student || student.id !== targetStudentId) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    // 학습 진도
    const learningProgress = await prisma.learningProgress.findMany({
      where: { userId: targetStudentId },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            subject: true,
            grade: true,
            difficulty: true,
            duration: true,
          },
        },
      },
      orderBy: {
        lastAccessedAt: "desc",
      },
      take: 20,
    });

    // 과제
    const assignments = await prisma.assignment.findMany({
      where: { userId: targetStudentId },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: "desc",
      },
      take: 20,
    });

    // 시험 점수
    const testScores = await prisma.testScore.findMany({
      where: { userId: targetStudentId },
      orderBy: {
        testDate: "desc",
      },
      take: 20,
    });

    // 숙제 제출
    const homeworkSubmissions = await prisma.homeworkSubmission.findMany({
      where: { userId: targetStudentId },
      orderBy: {
        submittedAt: "desc",
      },
      take: 20,
    });

    // 봇 대화 기록
    const botConversations = await prisma.botConversation.findMany({
      where: { userId: targetStudentId },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: 10,
    });

    // 통계 계산
    const stats = {
      totalLearningProgress: learningProgress.length,
      completedProgress: learningProgress.filter((p) => p.status === "COMPLETED").length,
      inProgressCount: learningProgress.filter((p) => p.status === "IN_PROGRESS").length,
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter((a) => a.status === "GRADED").length,
      pendingAssignments: assignments.filter((a) => a.status === "PENDING").length,
      totalTestScores: testScores.length,
      averageTestScore:
        testScores.length > 0
          ? Math.round(
              testScores.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) /
                testScores.length
            )
          : 0,
      totalHomeworks: homeworkSubmissions.length,
      averageHomeworkScore:
        homeworkSubmissions.length > 0
          ? Math.round(
              homeworkSubmissions.reduce((sum, h) => sum + (h.overallScore || 0), 0) /
                homeworkSubmissions.length
            )
          : 0,
      totalConversations: botConversations.length,
      totalStudyTime: learningProgress.reduce((sum, p) => sum + p.timeSpent, 0),
    };

    return NextResponse.json({
      success: true,
      student,
      stats,
      learningProgress,
      assignments,
      testScores,
      homeworkSubmissions,
      botConversations,
    });
  } catch (error) {
    console.error("❌ 학습 기록 조회 오류:", error);
    return NextResponse.json(
      { error: "학습 기록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
