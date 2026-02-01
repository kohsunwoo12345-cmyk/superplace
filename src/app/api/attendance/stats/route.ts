import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attendance/stats
 * 출석 현황 통계 조회 (학원장/선생님/관리자)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    // SUPER_ADMIN, DIRECTOR, TEACHER만 접근 가능
    if (!["SUPER_ADMIN", "DIRECTOR", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // URL 파라미터에서 날짜 범위 가져오기
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // 기본값: 최근 30일
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    if (!startDateParam) {
      startDate.setDate(startDate.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    console.log("📊 출석 통계 조회:", {
      role,
      academyId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // 학원 필터 조건
    const academyFilter =
      role === "SUPER_ADMIN" ? {} : { academyId };

    // 학생 목록 조회
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...academyFilter,
        approved: true,
      },
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
      orderBy: {
        name: "asc",
      },
    });

    // 각 학생의 출석 정보 조회
    const attendanceData = await Promise.all(
      students.map(async (student) => {
        const attendances = await prisma.attendance.findMany({
          where: {
            userId: student.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            date: "desc",
          },
        });

        // 통계 계산
        const total = attendances.length;
        const present = attendances.filter((a) => a.status === "PRESENT").length;
        const absent = attendances.filter((a) => a.status === "ABSENT").length;
        const late = attendances.filter((a) => a.status === "LATE").length;
        const excused = attendances.filter((a) => a.status === "EXCUSED").length;

        // 출석률 계산
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

        // 최근 출석일
        const lastAttendance = attendances[0];

        return {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            studentCode: student.studentCode,
            grade: student.grade,
            academy: student.academy,
          },
          stats: {
            total,
            present,
            absent,
            late,
            excused,
            attendanceRate,
          },
          lastAttendance: lastAttendance
            ? {
                date: lastAttendance.date,
                status: lastAttendance.status,
                notes: lastAttendance.notes,
              }
            : null,
          recentAttendances: attendances.slice(0, 7), // 최근 7일
        };
      })
    );

    // 전체 통계
    const totalStats = {
      totalStudents: students.length,
      totalAttendances: attendanceData.reduce((sum, data) => sum + data.stats.total, 0),
      totalPresent: attendanceData.reduce((sum, data) => sum + data.stats.present, 0),
      totalAbsent: attendanceData.reduce((sum, data) => sum + data.stats.absent, 0),
      totalLate: attendanceData.reduce((sum, data) => sum + data.stats.late, 0),
      totalExcused: attendanceData.reduce((sum, data) => sum + data.stats.excused, 0),
      averageAttendanceRate:
        attendanceData.length > 0
          ? Math.round(
              attendanceData.reduce((sum, data) => sum + data.stats.attendanceRate, 0) /
                attendanceData.length
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalStats,
      students: attendanceData,
    });
  } catch (error) {
    console.error("❌ 출석 통계 조회 오류:", error);
    return NextResponse.json(
      { error: "출석 통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
