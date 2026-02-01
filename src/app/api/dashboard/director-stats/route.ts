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

    const { role, academyId } = session.user;

    // 학원장 또는 선생님만 접근 가능
    if (role !== "DIRECTOR" && role !== "TEACHER") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (!academyId) {
      return NextResponse.json({ error: "학원 정보를 찾을 수 없습니다" }, { status: 400 });
    }

    // 학원 기본 정보
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        name: true,
        subscriptionPlan: true,
        maxStudents: true,
        maxTeachers: true,
        aiUsageLimit: true,
      },
    });

    if (!academy) {
      return NextResponse.json({ error: "학원을 찾을 수 없습니다" }, { status: 404 });
    }

    // 학생 수
    const totalStudents = await prisma.user.count({
      where: {
        academyId,
        role: "STUDENT",
      },
    });

    const approvedStudents = await prisma.user.count({
      where: {
        academyId,
        role: "STUDENT",
        approved: true,
      },
    });

    // 선생님 수
    const totalTeachers = await prisma.user.count({
      where: {
        academyId,
        role: "TEACHER",
      },
    });

    // 수업 수
    const totalClasses = await prisma.class.count({
      where: {
        academyId,
        isActive: true,
      },
    });

    // 최근 30일 출석 통계
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendances = await prisma.attendance.findMany({
      where: {
        user: {
          academyId,
          role: "STUDENT",
        },
        date: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        status: true,
      },
    });

    const attendanceStats = {
      total: attendances.length,
      present: attendances.filter((a) => a.status === "PRESENT").length,
      absent: attendances.filter((a) => a.status === "ABSENT").length,
      late: attendances.filter((a) => a.status === "LATE").length,
      rate:
        attendances.length > 0
          ? (attendances.filter((a) => a.status === "PRESENT").length / attendances.length) * 100
          : 0,
    };

    // 최근 30일 과제 통계
    const assignments = await prisma.assignment.findMany({
      where: {
        user: {
          academyId,
          role: "STUDENT",
        },
        dueDate: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        status: true,
        score: true,
      },
    });

    const assignmentStats = {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === "PENDING").length,
      submitted: assignments.filter((a) => a.status === "SUBMITTED").length,
      graded: assignments.filter((a) => a.status === "GRADED").length,
      averageScore:
        assignments.filter((a) => a.score !== null).length > 0
          ? assignments
              .filter((a) => a.score !== null)
              .reduce((sum, a) => sum + (a.score || 0), 0) /
            assignments.filter((a) => a.score !== null).length
          : 0,
    };

    // 학생별 요약 데이터 (상위 5명 - 출석률 기준)
    const students = await prisma.user.findMany({
      where: {
        academyId,
        role: "STUDENT",
        approved: true,
      },
      select: {
        id: true,
        name: true,
        grade: true,
        email: true,
        attendances: {
          where: {
            date: {
              gte: thirtyDaysAgo,
            },
          },
          select: {
            status: true,
          },
        },
        assignments: {
          where: {
            dueDate: {
              gte: thirtyDaysAgo,
            },
          },
          select: {
            status: true,
            score: true,
          },
        },
        learningProgress: {
          select: {
            progress: true,
            status: true,
          },
        },
      },
      take: 10,
    });

    const studentsWithStats = students.map((student) => {
      const attendanceRate =
        student.attendances.length > 0
          ? (student.attendances.filter((a) => a.status === "PRESENT").length /
              student.attendances.length) *
            100
          : 0;

      const assignmentCompletionRate =
        student.assignments.length > 0
          ? (student.assignments.filter((a) => a.status === "GRADED").length /
              student.assignments.length) *
            100
          : 0;

      const averageProgress =
        student.learningProgress.length > 0
          ? student.learningProgress.reduce((sum, p) => sum + p.progress, 0) /
            student.learningProgress.length
          : 0;

      const averageScore =
        student.assignments.filter((a) => a.score !== null).length > 0
          ? student.assignments
              .filter((a) => a.score !== null)
              .reduce((sum, a) => sum + (a.score || 0), 0) /
            student.assignments.filter((a) => a.score !== null).length
          : 0;

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        email: student.email,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        assignmentCompletionRate: Math.round(assignmentCompletionRate * 10) / 10,
        averageProgress: Math.round(averageProgress * 10) / 10,
        averageScore: Math.round(averageScore * 10) / 10,
      };
    });

    // 출석률 기준으로 정렬
    studentsWithStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

    const stats = {
      academy: {
        name: academy.name,
        plan: academy.subscriptionPlan,
        limits: {
          maxStudents: academy.maxStudents,
          maxTeachers: academy.maxTeachers,
          aiUsageLimit: academy.aiUsageLimit,
        },
      },
      counts: {
        students: {
          total: totalStudents,
          approved: approvedStudents,
          pending: totalStudents - approvedStudents,
        },
        teachers: totalTeachers,
        classes: totalClasses,
      },
      attendance: attendanceStats,
      assignments: assignmentStats,
      topStudents: studentsWithStats.slice(0, 5),
      allStudents: studentsWithStats,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("❌ 학원장 통계 조회 중 오류:", error);
    return NextResponse.json(
      { error: "통계를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
