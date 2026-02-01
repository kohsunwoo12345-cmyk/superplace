import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 학원장 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 모든 학원장 목록 조회
    const directors = await prisma.user.findMany({
      where: {
        role: 'DIRECTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        academyId: true,
        academy: {
          select: {
            name: true,
          },
        },
        assignedBots: {
          where: {
            isActive: true,
          },
          select: {
            botId: true,
          },
        },
      },
    });

    // 할당된 봇 ID 목록 추출
    const directorsWithBots = directors.map((director) => ({
      id: director.id,
      name: director.name,
      email: director.email,
      academyId: director.academyId,
      academyName: director.academy?.name,
      assignedBots: director.assignedBots.map((ab) => ab.botId),
    }));

    return NextResponse.json({ directors: directorsWithBots });
  } catch (error) {
    console.error('Error fetching directors:', error);
    return NextResponse.json(
      { error: '학원장 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
