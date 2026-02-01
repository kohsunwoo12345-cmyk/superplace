import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;

    // 할당된 봇 조회 (만료일 체크 포함)
    const assignments = await prisma.botAssignment.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      select: {
        botId: true,
      },
    });

    const assignedBotIds = assignments.map(a => a.botId);

    // DB 봇 조회
    const dbBots = await prisma.aIBot.findMany({
      where: {
        botId: { in: assignedBotIds },
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
        referenceFiles: true,
        enableImageInput: true,
        enableVoiceOutput: true,
        enableVoiceInput: true,
      },
    });

    // 기본 봇(gems) 포함
    const { gems } = await import('@/lib/gems/data');
    const defaultBots = gems.filter(g => assignedBotIds.includes(g.id));

    // DB 봇을 표준 형식으로 변환
    const convertedDbBots = dbBots.map((bot) => ({
      id: bot.botId,
      name: bot.name,
      nameEn: bot.nameEn,
      description: bot.description,
      icon: bot.icon,
      color: bot.color,
      bgGradient: bot.bgGradient,
      systemPrompt: bot.systemPrompt,
      starterMessages: bot.starterMessages,
      referenceFiles: bot.referenceFiles,
      enableImageInput: bot.enableImageInput,
      enableVoiceOutput: bot.enableVoiceOutput,
      enableVoiceInput: bot.enableVoiceInput,
      source: "database" as const,
    }));

    // 중복 제거 (DB 봇 우선)
    const dbBotIds = new Set(convertedDbBots.map(b => b.id));
    const filteredDefaultBots = defaultBots
      .filter(bot => !dbBotIds.has(bot.id))
      .map(bot => ({
        ...bot,
        source: "default" as const,
      }));

    const bots = [...convertedDbBots, ...filteredDefaultBots];

    return NextResponse.json({ bots }, { status: 200 });
  } catch (error) {
    console.error("❌ 할당된 봇 조회 중 오류:", error);
    return NextResponse.json(
      { error: "할당된 봇을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
