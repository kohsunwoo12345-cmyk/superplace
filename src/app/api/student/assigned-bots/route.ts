import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 학생이 할당받은 봇 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: '학생만 접근할 수 있습니다' }, { status: 403 });
    }

    // 학생에게 할당된 봇 조회
    const assignments = await prisma.botAssignment.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
    });

    const botIds = assignments.map(a => a.botId);

    // AI 봇 정보 조회
    const bots = await prisma.aIBot.findMany({
      where: {
        botId: { in: botIds },
        isActive: true,
      },
      select: {
        botId: true,
        name: true,
        nameEn: true,
        description: true,
        icon: true,
        color: true,
        bgGradient: true,
        systemPrompt: true,
        starterMessages: true,
        enableImageInput: true,
        enableVoiceOutput: true,
        enableVoiceInput: true,
      },
    });

    // 기본 봇도 포함 (gems)
    const { gems } = await import('@/lib/gems/data');
    const defaultBots = gems.filter(g => botIds.includes(g.id));

    // 중복 제거
    const dbBotIds = new Set(bots.map(b => b.botId));
    const allBots = [
      ...bots.map(bot => ({
        id: bot.botId,
        name: bot.name,
        nameEn: bot.nameEn,
        description: bot.description,
        icon: bot.icon,
        color: bot.color,
        bgGradient: bot.bgGradient,
        systemPrompt: bot.systemPrompt,
        starterMessages: bot.starterMessages,
        enableImageInput: bot.enableImageInput,
        enableVoiceOutput: bot.enableVoiceOutput,
        enableVoiceInput: bot.enableVoiceInput,
        source: 'database',
      })),
      ...defaultBots.filter(bot => !dbBotIds.has(bot.id)).map(bot => ({
        ...bot,
        source: 'default',
      })),
    ];

    return NextResponse.json({ bots: allBots });
  } catch (error) {
    console.error('할당된 봇 조회 오류:', error);
    return NextResponse.json(
      { error: '할당된 봇 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
