import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 매출 통계 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, academyId: true },
    });

    // SUPER_ADMIN 또는 DIRECTOR만 매출 통계 조회 가능
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'DIRECTOR')) {
      return NextResponse.json(
        { error: '매출 통계 조회 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'month'; // day, week, month, year, all

    // 기간 설정
    const now = new Date();
    let dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter = {
        paidAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      // 기간별 필터
      switch (period) {
        case 'day':
          dateFilter = {
            paidAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            },
          };
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = {
            paidAt: {
              gte: weekAgo,
            },
          };
          break;
        case 'month':
          dateFilter = {
            paidAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          };
          break;
        case 'year':
          dateFilter = {
            paidAt: {
              gte: new Date(now.getFullYear(), 0, 1),
            },
          };
          break;
        case 'all':
          // 모든 기간
          break;
      }
    }

    // 권한별 필터 (학원장은 자기 학원만)
    const whereCondition: any = {
      status: 'COMPLETED',
      ...dateFilter,
    };

    if (currentUser.role === 'DIRECTOR' && currentUser.academyId) {
      whereCondition.academyId = currentUser.academyId;
    }

    // 총 매출 및 결제 건수
    const [totalRevenue, paymentCount] = await Promise.all([
      prisma.payment.aggregate({
        where: whereCondition,
        _sum: {
          amount: true,
        },
      }),
      prisma.payment.count({
        where: whereCondition,
      }),
    ]);

    // 상품별 매출
    const revenueByProduct = await prisma.payment.groupBy({
      by: ['productId', 'productName', 'plan'],
      where: whereCondition,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    // 결제 수단별 통계
    const revenueByPaymentMethod = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: whereCondition,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // 월별 매출 추이 (최근 12개월)
    let monthlyRevenue: Array<{ month: string; revenue: number; count: number }> = [];
    
    if (currentUser.role === 'DIRECTOR' && currentUser.academyId) {
      // 학원장: 자기 학원만
      monthlyRevenue = await prisma.$queryRaw`
        SELECT 
          TO_CHAR("paidAt", 'YYYY-MM') as month,
          COALESCE(SUM(amount::numeric), 0)::float as revenue,
          COUNT(*)::int as count
        FROM "Payment"
        WHERE status = 'COMPLETED'
          AND "paidAt" >= NOW() - INTERVAL '12 months'
          AND "academyId" = ${currentUser.academyId}
        GROUP BY TO_CHAR("paidAt", 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `;
    } else {
      // SUPER_ADMIN: 모든 학원
      monthlyRevenue = await prisma.$queryRaw`
        SELECT 
          TO_CHAR("paidAt", 'YYYY-MM') as month,
          COALESCE(SUM(amount::numeric), 0)::float as revenue,
          COUNT(*)::int as count
        FROM "Payment"
        WHERE status = 'COMPLETED'
          AND "paidAt" >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR("paidAt", 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `;
    }

    // 최근 결제 내역 (상위 10개)
    const recentPayments = await prisma.payment.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
      take: 10,
    });

    // 평균 결제 금액
    const avgPayment = totalRevenue._sum.amount
      ? Number(totalRevenue._sum.amount) / paymentCount
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Number(totalRevenue._sum.amount || 0),
          paymentCount,
          avgPayment,
          currency: 'KRW',
        },
        byProduct: revenueByProduct.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          plan: item.plan,
          revenue: Number(item._sum.amount || 0),
          count: item._count.id,
        })),
        byPaymentMethod: revenueByPaymentMethod.map((item) => ({
          method: item.paymentMethod || 'UNKNOWN',
          revenue: Number(item._sum.amount || 0),
          count: item._count.id,
        })),
        monthlyTrend: monthlyRevenue.map((item) => ({
          month: item.month,
          revenue: Number(item.revenue),
          count: item.count,
        })),
        recentPayments: recentPayments.map((payment) => ({
          id: payment.id,
          productName: payment.productName,
          plan: payment.plan,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt?.toISOString(),
          user: payment.user,
          academy: payment.academy,
        })),
      },
    });
  } catch (error) {
    console.error('매출 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '매출 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
