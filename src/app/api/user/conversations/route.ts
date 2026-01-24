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

    // 할당받은 봇 목록 조회
    let assignedBots = [];
    
    if (session.user.role === "SUPER_ADMIN") {
      // 슈퍼 관리자는 모든 활성 봇 접근 가능
      assignedBots = await prisma.aIBot.findMany({
        where: {
          isActive: true,
        },
        select: {
          botId: true,
          name: true,
          icon: true,
          description: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    } else {
      // 일반 사용자는 할당받은 봇만
      const assignments = await prisma.botAssignment.findMany({
        where: {
          userId: session.user.id,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          bot: {
            select: {
              botId: true,
              name: true,
              icon: true,
              description: true,
              isActive: true,
            },
          },
        },
      });

      assignedBots = assignments
        .filter((a) => a.bot.isActive)
        .map((a) => ({
          botId: a.bot.botId,
          name: a.bot.name,
          icon: a.bot.icon,
          description: a.bot.description,
        }));
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
        isPinned: false, // 추후 DB에 추가 예정
      });
    });

    // 봇별로 그룹핑된 결과 생성
    const conversationGroups = Array.from(grouped.entries()).map(([botId, convs]) => {
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
      assignedBots, // 할당받은 봇 목록
      conversations: conversationGroups, // 대화 목록
    });
  } catch (error) {
    console.error("대화 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "대화 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
