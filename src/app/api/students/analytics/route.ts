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

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // 학생 본인이거나 학원장/선생님이어야 함
    const { role, id: userId, academyId } = session.user;

    let targetStudentId = studentId;
    
    // 학생 본인인 경우
    if (role === "STUDENT") {
      targetStudentId = userId;
    } else if (role !== "DIRECTOR" && role !== "TEACHER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (!targetStudentId) {
      return NextResponse.json({ error: "학생 ID가 필요합니다" }, { status: 400 });
    }

    // 학생 정보 조회
    const student = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: {
        enrolledClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
          },
        },
        assignments: {
          select: {
            id: true,
            status: true,
            score: true,
            dueDate: true,
            submittedAt: true,
          },
        },
        testScores: {
          select: {
            subject: true,
            score: true,
            maxScore: true,
            testDate: true,
          },
          orderBy: {
            testDate: "desc",
          },
          take: 10,
        },
        attendances: {
          select: {
            status: true,
            date: true,
          },
          orderBy: {
            date: "desc",
          },
          take: 30,
        },
        learningProgress: {
          include: {
            material: {
              select: {
                title: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다" }, { status: 404 });
    }

    // 권한 확인 (같은 학원 소속인지)
    if (role === "DIRECTOR" || role === "TEACHER") {
      if (student.academyId !== academyId) {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
      }
    }

    // 데이터 분석
    const analytics = {
      // 기본 정보
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        grade: student.grade,
        studentId: student.studentId,
      },

      // 수업 정보
      classes: student.enrolledClasses.map((ec) => ({
        id: ec.class.id,
        name: ec.class.name,
        grade: ec.class.grade,
        status: ec.status,
        enrolledAt: ec.enrolledAt,
      })),

      // 과제 분석
      assignments: {
        total: student.assignments.length,
        completed: student.assignments.filter((a) => a.status === "GRADED").length,
        pending: student.assignments.filter((a) => a.status === "PENDING").length,
        submitted: student.assignments.filter((a) => a.status === "SUBMITTED").length,
        averageScore:
          student.assignments.filter((a) => a.score !== null).length > 0
            ? student.assignments
                .filter((a) => a.score !== null)
                .reduce((sum, a) => sum + (a.score || 0), 0) /
              student.assignments.filter((a) => a.score !== null).length
            : 0,
        onTimeSubmissionRate:
          student.assignments.filter((a) => a.submittedAt).length > 0
            ? (student.assignments.filter(
                (a) => a.submittedAt && a.submittedAt <= a.dueDate
              ).length /
                student.assignments.filter((a) => a.submittedAt).length) *
              100
            : 0,
      },

      // 시험 성적 분석
      testScores: {
        recent: student.testScores.slice(0, 5),
        average:
          student.testScores.length > 0
            ? student.testScores.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) /
              student.testScores.length
            : 0,
        bySubject: Object.entries(
          student.testScores.reduce((acc, t) => {
            if (!acc[t.subject]) {
              acc[t.subject] = { scores: [], count: 0 };
            }
            acc[t.subject].scores.push((t.score / t.maxScore) * 100);
            acc[t.subject].count++;
            return acc;
          }, {} as Record<string, { scores: number[]; count: number }>)
        ).map(([subject, data]) => ({
          subject,
          average: data.scores.reduce((a, b) => a + b, 0) / data.count,
          count: data.count,
        })),
      },

      // 출석 분석
      attendance: {
        total: student.attendances.length,
        present: student.attendances.filter((a) => a.status === "PRESENT").length,
        absent: student.attendances.filter((a) => a.status === "ABSENT").length,
        late: student.attendances.filter((a) => a.status === "LATE").length,
        excused: student.attendances.filter((a) => a.status === "EXCUSED").length,
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
        notStarted: student.learningProgress.filter((p) => p.status === "NOT_STARTED").length,
        averageProgress:
          student.learningProgress.length > 0
            ? student.learningProgress.reduce((sum, p) => sum + p.progress, 0) /
              student.learningProgress.length
            : 0,
        totalTimeSpent: student.learningProgress.reduce((sum, p) => sum + p.timeSpent, 0),
      },
    };

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error("❌ 학생 분석 데이터 조회 중 오류:", error);
    return NextResponse.json(
      { error: "분석 데이터를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
