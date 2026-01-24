import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자의 모든 대화 조회
    const conversations = await prisma.botConversation.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    // 각 대화의 봇 정보 조회
    const botIds = [...new Set(conversations.map((c) => c.botId))];
    const bots = await prisma.aIBot.findMany({
      where: {
        botId: {
          in: botIds,
        },
      },
      select: {
        botId: true,
        name: true,
        icon: true,
        description: true,
      },
    });

    // 봇별로 그룹핑
    const botMap = new Map(bots.map((b) => [b.botId, b]));
    const grouped = new Map<string, any[]>();

    conversations.forEach((conv) => {
      const bot = botMap.get(conv.botId);
      if (!bot) return;

      if (!grouped.has(conv.botId)) {
        grouped.set(conv.botId, []);
      }

      // 메시지 배열에서 마지막 메시지 추출
      const messages = Array.isArray(conv.messages) ? conv.messages : [];
      const lastMessage = messages.length > 0 
        ? messages[messages.length - 1]?.content || "새 대화"
        : "새 대화";

      grouped.get(conv.botId)!.push({
        id: conv.id,
        botId: conv.botId,
        botName: bot.name,
        botIcon: bot.icon,
        lastMessage: lastMessage.substring(0, 100), // 100자로 제한
        lastMessageAt: conv.lastMessageAt.toISOString(),
        messageCount: conv.messageCount,
      });
    });

    // 봇별로 그룹핑된 결과 생성
    const result = Array.from(grouped.entries()).map(([botId, convs]) => {
      const bot = botMap.get(botId);
      return {
        botId,
        botName: bot?.name || "알 수 없음",
        botIcon: bot?.icon || "🤖",
        conversations: convs,
      };
    });

    return NextResponse.json({
      success: true,
      conversations: result,
    });
  } catch (error) {
    console.error("대화 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "대화 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
