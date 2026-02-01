import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      );
    }

    // Get statistics
    const totalUsers = await prisma.user.count();
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: thisMonth,
        },
      },
    });

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    });

    const subscriptionRate = totalUsers > 0 
      ? Math.round((activeSubscriptions / totalUsers) * 100) 
      : 0;

    // Calculate monthly revenue
    const monthlyPayments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: thisMonth,
        },
      },
      select: {
        amount: true,
      },
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get previous month revenue for growth calculation
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthPayments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: lastMonth,
          lt: thisMonth,
        },
      },
      select: {
        amount: true,
      },
    });

    const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    // Get platform connections (mock data for now)
    const connectedPlatforms = 6; // Total available platforms
    const totalConnections = await prisma.naverBlog.count() +
                             await prisma.naverPlace.count() +
                             await prisma.instagram.count() +
                             await prisma.youtube.count() +
                             await prisma.tikTok.count() +
                             await prisma.karrot.count();

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get subscriptions by plan
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        planType: true,
      },
    });

    const subscriptionsByPlan = subscriptions.reduce((acc: any, sub) => {
      acc[sub.planType] = (acc[sub.planType] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      totalUsers,
      newUsersThisMonth,
      activeSubscriptions,
      subscriptionRate,
      monthlyRevenue,
      revenueGrowth,
      connectedPlatforms,
      totalConnections,
      recentUsers,
      subscriptionsByPlan,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
