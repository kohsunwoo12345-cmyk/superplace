import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 결제 목록 조회
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

    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'DIRECTOR')) {
      return NextResponse.json(
        { error: '결제 목록 조회 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // COMPLETED, PENDING, FAILED, CANCELLED, REFUNDED
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // 필터 조건
    const where: any = {};

    // 권한별 필터
    if (currentUser.role === 'DIRECTOR' && currentUser.academyId) {
      where.academyId = currentUser.academyId;
    }

    // 상태 필터
    if (status) {
      where.status = status;
    }

    // 날짜 필터
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paidAt.lte = end;
      }
    }

    // 결제 목록 조회
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          academy: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              plan: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
          paidAt: payment.paidAt?.toISOString(),
          cancelledAt: payment.cancelledAt?.toISOString(),
          refundedAt: payment.refundedAt?.toISOString(),
          subscriptionStartDate: payment.subscriptionStartDate?.toISOString(),
          subscriptionEndDate: payment.subscriptionEndDate?.toISOString(),
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('결제 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '결제 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
