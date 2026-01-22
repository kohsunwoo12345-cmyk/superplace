import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 전체 통계 API (관리자용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 전체 학원 수
    const totalAcademies = await prisma.academy.count();

    // 전체 학생 수
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' },
    });

    // 전체 선생님 수
    const totalTeachers = await prisma.user.count({
      where: { role: 'TEACHER' },
    });

    // 지난 달 대비 증가 계산
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const academiesLastMonth = await prisma.academy.count({
      where: {
        createdAt: {
          lt: thisMonthStart,
        },
      },
    });

    const studentsLastMonth = await prisma.user.count({
      where: {
        role: 'STUDENT',
        createdAt: {
          lt: thisMonthStart,
        },
      },
    });

    const teachersLastMonth = await prisma.user.count({
      where: {
        role: 'TEACHER',
        createdAt: {
          lt: thisMonthStart,
        },
      },
    });

    const academiesGrowth = totalAcademies - academiesLastMonth;
    const studentsGrowth = totalStudents - studentsLastMonth;
    const teachersGrowth = totalTeachers - teachersLastMonth;

    // 총 매출 (가상 데이터 - Subscription 모델에 price 필드 없음)
    const totalRevenue = totalAcademies * 200000; // 학원당 평균 20만원

    // 활성 구독
    const activeSubscriptions = await prisma.academy.count({
      where: {
        isActive: true,
      },
    });

    // 학습 자료 수
    const totalMaterials = await prisma.learningMaterial.count();

    // 과제 수
    const totalAssignments = await prisma.assignment.count();

    // 평균 출석률
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalAttendances = await prisma.attendance.count({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const presentAttendances = await prisma.attendance.count({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
        status: 'PRESENT',
      },
    });

    const avgAttendanceRate = totalAttendances > 0
      ? Number(((presentAttendances / totalAttendances) * 100).toFixed(1))
      : 0;

    // 월별 매출 추이 (최근 6개월)
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const academiesCount = await prisma.academy.count({
        where: {
          createdAt: {
            lt: monthEnd,
          },
          isActive: true,
        },
      });

      const subscriptionsCount = academiesCount;

      revenueData.push({
        month: monthStart.toLocaleDateString('ko-KR', { month: 'short' }),
        revenue: academiesCount * 200000,
        subscriptions: subscriptionsCount,
      });
    }

    // 사용자 증가 추이 (최근 6개월)
    const userGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const studentsCount = await prisma.user.count({
        where: {
          role: 'STUDENT',
          createdAt: {
            lt: monthEnd,
          },
        },
      });

      const teachersCount = await prisma.user.count({
        where: {
          role: 'TEACHER',
          createdAt: {
            lt: monthEnd,
          },
        },
      });

      const academiesCount = await prisma.academy.count({
        where: {
          createdAt: {
            lt: monthEnd,
          },
        },
      });

      userGrowthData.push({
        month: monthStart.toLocaleDateString('ko-KR', { month: 'short' }),
        students: studentsCount,
        teachers: teachersCount,
        academies: academiesCount,
      });
    }

    // 상위 학원 TOP 5 (학생 수 기준)
    const topAcademies = await prisma.academy.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        users: {
          where: {
            role: {
              in: ['STUDENT', 'TEACHER'],
            },
          },
          select: {
            role: true,
          },
        },
      },
      take: 100, // 전체 가져와서 필터링
    });

    const academiesWithCounts = topAcademies.map((academy) => {
      const students = academy.users.filter((u) => u.role === 'STUDENT').length;
      const teachers = academy.users.filter((u) => u.role === 'TEACHER').length;
      return {
        name: academy.name,
        students,
        teachers,
        revenue: students * 15000, // 학생당 1.5만원
      };
    });

    const sortedAcademies = academiesWithCounts
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    // 시스템 활동성
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyActiveUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: today,
        },
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyActiveUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const monthlyActiveUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: thisMonthStart,
        },
      },
    });

    // 콘텐츠 활동
    const todayMaterials = await prisma.learningMaterial.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const todayAssignments = await prisma.assignment.count({
      where: {
        submittedAt: {
          gte: today,
        },
      },
    });

    const todayAIUsage = await prisma.aIUsage.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 성장 지표
    const newSignupsThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    // 구독 갱신율 (활성 학원 비율)
    const subscriptionRenewalRate = totalAcademies > 0
      ? Number(((activeSubscriptions / totalAcademies) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      overallStats: {
        totalAcademies,
        totalStudents,
        totalTeachers,
        totalRevenue,
        activeSubscriptions,
        totalMaterials,
        totalAssignments,
        avgAttendanceRate,
      },
      growth: {
        academiesGrowth,
        studentsGrowth,
        teachersGrowth,
      },
      revenueData,
      userGrowthData,
      topAcademies: sortedAcademies,
      activityStats: {
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
      },
      contentActivity: {
        todayMaterials,
        todayAssignments,
        todayAIUsage,
      },
      growthIndicators: {
        newSignupsThisMonth,
        subscriptionRenewalRate,
        avgUsageTime: 2.4, // 가상 데이터
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
