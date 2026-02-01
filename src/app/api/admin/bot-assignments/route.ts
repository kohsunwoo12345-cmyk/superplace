import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 모든 봇 할당 현황 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const botId = searchParams.get('botId');

    // 특정 봇의 할당 현황 조회
    if (botId) {
      const assignments = await prisma.botAssignment.findMany({
        where: {
          botId,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              academy: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ assignments });
    }

    // 전체 할당 통계 조회 (botId별 count)
    const assignmentsByBot = await prisma.botAssignment.groupBy({
      by: ['botId'],
      where: {
        isActive: true,
      },
      _count: {
        id: true,
      },
    });

    // 각 botId에 대한 봇 이름도 함께 조회
    const botIds = assignmentsByBot.map(a => a.botId);
    const bots = await prisma.aIBot.findMany({
      where: {
        botId: {
          in: botIds,
        },
      },
      select: {
        botId: true,
        name: true,
        nameEn: true,
        icon: true,
      },
    });

    const botMap = new Map(bots.map(b => [b.botId, b]));

    const stats = assignmentsByBot.map(item => ({
      botId: item.botId,
      bot: botMap.get(item.botId),
      count: item._count.id,
    }));

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching bot assignments:', error);
    return NextResponse.json(
      { error: '할당 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
