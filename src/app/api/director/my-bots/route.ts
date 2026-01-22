import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 학원장이 할당받은 AI 봇 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DIRECTOR') {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 내가 할당받은 봇 목록 조회
    const myBots = await prisma.botAssignment.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        botId: true,
      },
    });

    const botIds = myBots.map((b) => b.botId);

    return NextResponse.json({ botIds });
  } catch (error) {
    console.error('Error fetching my bots:', error);
    return NextResponse.json(
      { error: '내 AI 봇 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
