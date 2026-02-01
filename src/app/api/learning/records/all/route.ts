import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/learning/records/all
 * 학원의 모든 학생 학습 기록 조회 (학원장/선생님용)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    // 권한 확인 (학원장, 선생님, 관리자만)
    if (role !== "DIRECTOR" && role !== "TEACHER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 학원의 모든 학생 조회
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        academyId: role === "SUPER_ADMIN" ? undefined : academyId,
        approved: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentCode: true,
        grade: true,
        academyId: true,
        lastLoginAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const records = [];

    for (const student of students) {
      // 과제 통계
      const assignments = await prisma.assignment.findMany({
        where: { userId: student.id },
        select: {
          id: true,
          status: true,
          score: true,
        },
      });

      const completedAssignments = assignments.filter((a) => a.status === "GRADED");
      const avgScore =
        completedAssignments.length > 0
          ? completedAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / completedAssignments.length
          : 0;

      // 시험 점수 통계
      const testScores = await prisma.testScore.findMany({
        where: { userId: student.id },
        select: {
          score: true,
          maxScore: true,
          subject: true,
        },
      });

      const avgTestScore =
        testScores.length > 0
          ? testScores.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) / testScores.length
          : 0;

      // 과목별 점수
      const subjectMap = new Map<string, { sum: number; count: number }>();
      testScores.forEach((t) => {
        const existing = subjectMap.get(t.subject) || { sum: 0, count: 0 };
        existing.sum += (t.score / t.maxScore) * 100;
        existing.count += 1;
        subjectMap.set(t.subject, existing);
      });

      const subjects = Array.from(subjectMap.entries()).map(([name, { sum, count }]) => ({
        name,
        score: sum / count,
        count,
      }));

      // 출석 통계
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendances = await prisma.attendance.findMany({
        where: {
          userId: student.id,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          status: true,
        },
      });

      const totalClasses = attendances.length;
      const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
      const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

      // AI 대화 통계
      const aiChatCount = await prisma.botConversation.count({
        where: { userId: student.id },
      });

      // AI 대화 분석 결과 조회 (최신 1개)
      const latestAnalysis = await prisma.conversationAnalysis.findFirst({
        where: { userId: student.id },
        orderBy: { analyzedAt: "desc" },
        select: {
          engagementScore: true,
          responseQuality: true,
          questionDepth: true,
          consistency: true,
          summary: true,
          strengths: true,
          weaknesses: true,
          recommendations: true,
          analyzedAt: true,
        },
      });

      // 학습 추이 계산 (7일 전 vs 현재)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentTestScores = await prisma.testScore.findMany({
        where: {
          userId: student.id,
          testDate: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          score: true,
          maxScore: true,
        },
      });

      const recentAvgScore =
        recentTestScores.length > 0
          ? recentTestScores.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) /
            recentTestScores.length
          : 0;

      const weekTrend = recentAvgScore - avgTestScore;

      // 30일 전 vs 현재
      const thirtyDaysAvgScore = avgTestScore; // 이미 전체 평균
      const monthTrend = recentAvgScore - thirtyDaysAvgScore;

      records.push({
        id: student.id,
        studentId: student.id,
        studentName: student.name,
        studentCode: student.studentCode || "",
        grade: student.grade,
        totalAssignments: assignments.length,
        completedAssignments: completedAssignments.length,
        avgScore,
        totalTests: testScores.length,
        avgTestScore,
        attendanceRate,
        totalClasses,
        aiChatCount,
        lastActivity: student.lastLoginAt?.toISOString() || null,
        progress: {
          week: weekTrend,
          month: monthTrend,
        },
        subjects,
        aiAnalysis: latestAnalysis
          ? {
              engagementScore: latestAnalysis.engagementScore,
              responseQuality: latestAnalysis.responseQuality,
              questionDepth: latestAnalysis.questionDepth,
              consistency: latestAnalysis.consistency,
              summary: latestAnalysis.summary,
              strengths: latestAnalysis.strengths,
              weaknesses: latestAnalysis.weaknesses,
              recommendations: latestAnalysis.recommendations,
              lastAnalyzedAt: latestAnalysis.analyzedAt.toISOString(),
            }
          : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error("❌ 학습 기록 조회 오류:", error);
    return NextResponse.json({ error: "학습 기록 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
