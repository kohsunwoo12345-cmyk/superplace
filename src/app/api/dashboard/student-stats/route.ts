import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    if (role !== "STUDENT") {
      return NextResponse.json({ error: "학생만 접근 가능합니다" }, { status: 403 });
    }

    // 학생 데이터 조회
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrolledClasses: {
          include: {
            class: true,
          },
        },
        assignments: {
          where: {
            dueDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 최근 30일
            },
          },
        },
        testScores: {
          orderBy: {
            testDate: "desc",
          },
          take: 5,
        },
        attendances: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 최근 30일
            },
          },
        },
        learningProgress: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "학생 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    // 통계 계산
    const stats = {
      // 기본 정보
      name: student.name,
      grade: student.grade,
      points: student.points,

      // 수업 정보
      classes: {
        total: student.enrolledClasses.length,
        active: student.enrolledClasses.filter((ec) => ec.status === "ACTIVE").length,
      },

      // 과제 현황
      assignments: {
        total: student.assignments.length,
        pending: student.assignments.filter((a) => a.status === "PENDING").length,
        submitted: student.assignments.filter((a) => a.status === "SUBMITTED").length,
        completed: student.assignments.filter((a) => a.status === "GRADED").length,
        averageScore:
          student.assignments.filter((a) => a.score !== null).length > 0
            ? student.assignments
                .filter((a) => a.score !== null)
                .reduce((sum, a) => sum + (a.score || 0), 0) /
              student.assignments.filter((a) => a.score !== null).length
            : 0,
        upcomingCount: student.assignments.filter(
          (a) => a.status === "PENDING" && new Date(a.dueDate) > new Date()
        ).length,
      },

      // 시험 성적
      testScores: {
        recent: student.testScores.map((t) => ({
          subject: t.subject,
          score: t.score,
          maxScore: t.maxScore,
          percentage: (t.score / t.maxScore) * 100,
          date: t.testDate,
        })),
        average:
          student.testScores.length > 0
            ? student.testScores.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) /
              student.testScores.length
            : 0,
      },

      // 출석 현황
      attendance: {
        total: student.attendances.length,
        present: student.attendances.filter((a) => a.status === "PRESENT").length,
        absent: student.attendances.filter((a) => a.status === "ABSENT").length,
        late: student.attendances.filter((a) => a.status === "LATE").length,
        rate:
          student.attendances.length > 0
            ? (student.attendances.filter((a) => a.status === "PRESENT").length /
                student.attendances.length) *
              100
            : 0,
      },

      // 학습 진도
      learningProgress: {
        total: student.learningProgress.length,
        completed: student.learningProgress.filter((p) => p.status === "COMPLETED").length,
        inProgress: student.learningProgress.filter((p) => p.status === "IN_PROGRESS").length,
        averageProgress:
          student.learningProgress.length > 0
            ? student.learningProgress.reduce((sum, p) => sum + p.progress, 0) /
              student.learningProgress.length
            : 0,
        totalTimeSpent: student.learningProgress.reduce((sum, p) => sum + p.timeSpent, 0),
      },
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("❌ 학생 통계 조회 중 오류:", error);
    return NextResponse.json(
      { error: "통계를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
