import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 관리자 대시보드 통계 API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 전체 사용자 수
    const totalUsers = await prisma.user.count();

    // 역할별 사용자 수
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // 이번 달 신규 사용자
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    // 전체 학원 수
    const totalAcademies = await prisma.academy.count();

    // 활성 학원 수
    const activeAcademies = await prisma.academy.count({
      where: {
        isActive: true,
      },
    });

    // 요금제별 학원 분포
    const academiesByPlan = await prisma.academy.groupBy({
      by: ['subscriptionPlan'],
      _count: true,
      where: {
        isActive: true,
      },
    });

    // AI 사용량 (이번 달)
    const aiUsageThisMonth = await prisma.aIUsage.count({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    // 최근 가입 사용자 (7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        academyId: true,
        createdAt: true,
        academy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // 월별 사용자 증가 추이 (최근 6개월)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUserGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const usersCount = await prisma.user.count({
        where: {
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

      monthlyUserGrowth.push({
        month: monthStart.toLocaleDateString('ko-KR', { month: 'short' }),
        users: usersCount,
        academies: academiesCount,
      });
    }

    return NextResponse.json({
      totalUsers,
      usersByRole: Object.fromEntries(
        usersByRole.map((item) => [item.role, item._count])
      ),
      newUsersThisMonth,
      totalAcademies,
      activeAcademies,
      academiesByPlan: Object.fromEntries(
        academiesByPlan.map((item) => [item.subscriptionPlan, item._count])
      ),
      aiUsageThisMonth,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        academy: user.academy?.name || '미소속',
        createdAt: user.createdAt,
      })),
      monthlyUserGrowth,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
