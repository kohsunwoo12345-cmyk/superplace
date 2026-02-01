import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 학생의 대화 통계 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: '학생만 접근할 수 있습니다' }, { status: 403 });
    }

    // 학생의 대화 기록 조회
    const conversations = await prisma.botConversation.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        analysis: true,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // 봇별로 그룹화하여 통계 계산
    const botStats = new Map<string, {
      botId: string;
      totalConversations: number;
      totalMessages: number;
      lastUsed: Date;
      engagementScores: number[];
    }>();

    for (const conv of conversations) {
      if (!botStats.has(conv.botId)) {
        botStats.set(conv.botId, {
          botId: conv.botId,
          totalConversations: 0,
          totalMessages: 0,
          lastUsed: conv.lastMessageAt,
          engagementScores: [],
        });
      }

      const stat = botStats.get(conv.botId)!;
      stat.totalConversations++;
      stat.totalMessages += conv.messageCount;
      if (conv.lastMessageAt > stat.lastUsed) {
        stat.lastUsed = conv.lastMessageAt;
      }
      if (conv.analysis) {
        stat.engagementScores.push(conv.analysis.engagementScore);
      }
    }

    // 봇 정보 조회
    const botIds = Array.from(botStats.keys());
    const bots = await prisma.aIBot.findMany({
      where: {
        botId: { in: botIds },
      },
      select: {
        botId: true,
        name: true,
        icon: true,
      },
    });

    // 기본 봇도 포함
    const { gems } = await import('@/lib/gems/data');
    const defaultBotMap = new Map(gems.map(g => [g.id, { name: g.name, icon: g.icon }]));

    // 통계 결과 생성
    const stats = Array.from(botStats.values()).map(stat => {
      const bot = bots.find(b => b.botId === stat.botId);
      const defaultBot = defaultBotMap.get(stat.botId);
      
      return {
        botId: stat.botId,
        botName: bot?.name || defaultBot?.name || '알 수 없음',
        botIcon: bot?.icon || defaultBot?.icon || '🤖',
        totalConversations: stat.totalConversations,
        totalMessages: stat.totalMessages,
        lastUsed: stat.lastUsed.toISOString(),
        avgEngagement: stat.engagementScores.length > 0
          ? stat.engagementScores.reduce((a, b) => a + b, 0) / stat.engagementScores.length
          : 0,
      };
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('대화 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '대화 통계 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
