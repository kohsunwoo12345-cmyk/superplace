import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gems } from "@/lib/gems/data";

// GET: 활성화된 모든 AI 봇 조회 (DB + 기본 봇)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    console.log('🔍 /api/ai-bots 호출됨 - 사용자:', session.user.email, '역할:', session.user.role);

    // DB에서 활성화된 봇 조회
    const dbBots = await prisma.aIBot.findMany({
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
        bgGradient: true,
        systemPrompt: true,
        referenceFiles: true,
        enableImageInput: true,
        enableVoiceOutput: true,
        enableVoiceInput: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log('📦 DB 봇 수:', dbBots.length);
    dbBots.forEach(bot => {
      console.log(`  - ${bot.name} (botId: ${bot.botId})`);
    });

    // DB 봇을 gems 형식으로 변환
    const convertedDbBots = dbBots.map((bot) => ({
      id: bot.botId,
      name: bot.name,
      nameEn: bot.nameEn,
      description: bot.description,
      icon: bot.icon,
      color: bot.color,
      bgGradient: bot.bgGradient,
      systemPrompt: bot.systemPrompt,
      referenceFiles: bot.referenceFiles,
      enableImageInput: bot.enableImageInput,
      enableVoiceOutput: bot.enableVoiceOutput,
      enableVoiceInput: bot.enableVoiceInput,
      source: "database" as const,
    }));

    // 기본 봇 (data.ts)
    const defaultBots = gems.map((gem) => ({
      ...gem,
      source: "default" as const,
    }));

    console.log('📚 기본 봇 수:', defaultBots.length);

    // 중복 제거: DB 봇이 우선
    const dbBotIds = new Set(convertedDbBots.map((bot) => bot.id));
    const filteredDefaultBots = defaultBots.filter(
      (bot) => !dbBotIds.has(bot.id)
    );

    // 통합 목록
    const allBots = [...convertedDbBots, ...filteredDefaultBots];

    console.log('✅ 총 반환 봇 수:', allBots.length);

    return NextResponse.json({ bots: allBots }, { status: 200 });
  } catch (error) {
    console.error("❌ AI 봇 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "AI 봇 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
