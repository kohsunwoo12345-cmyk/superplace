import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bot/available
 * 
 * 사용 가능한 모든 활성 봇 목록 조회
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 모든 활성 봇 조회
    const bots = await prisma.aIBot.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        botId: true,
        name: true,
        nameEn: true,
        description: true,
        icon: true,
        color: true,
        enableImageInput: true,
        enableVoiceOutput: true,
        enableVoiceInput: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 현재 사용자의 할당 상태 확인
    const assignments = await prisma.botAssignment.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        botId: true,
      },
    });

    const assignedBotIds = new Set(assignments.map(a => a.botId));

    // 봇 목록에 할당 상태 추가
    const botsWithAssignmentStatus = bots.map(bot => ({
      ...bot,
      isAssigned: assignedBotIds.has(bot.id),
    }));

    return NextResponse.json({
      success: true,
      bots: botsWithAssignmentStatus,
      totalBots: bots.length,
      assignedCount: assignedBotIds.size,
    });
  } catch (error: any) {
    console.error('사용 가능한 봇 조회 오류:', error);
    return NextResponse.json(
      { error: '봇 목록을 가져오는 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
