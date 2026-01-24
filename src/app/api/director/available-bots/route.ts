import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 학원장에게 할당된 AI 봇 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 학원장만 접근 가능
    if (session.user.role !== 'DIRECTOR') {
      return NextResponse.json({ 
        error: "학원장만 접근 가능합니다" 
      }, { status: 403 });
    }

    const userId = session.user.id;

    // 할당된 봇 조회
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

    console.log('📋 학원장에게 할당된 봇 ID:', assignedBotIds);

    // 데이터베이스에서 할당된 봇 정보 조회
    const dbBots = await prisma.aIBot.findMany({
      where: {
        botId: {
          in: assignedBotIds,
        },
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
        starterMessages: true,
        referenceFiles: true,
        enableImageInput: true,
        enableVoiceOutput: true,
        enableVoiceInput: true,
      },
    });

    console.log('💾 DB에서 찾은 봇:', dbBots.map(b => b.botId));

    // 기본 봇(gems)도 포함
    const { gems } = await import('@/lib/gems/data');
    const defaultBots = gems.filter(g => assignedBotIds.includes(g.id));

    console.log('📚 기본 봇에서 찾은 봇:', defaultBots.map(b => b.id));

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

    console.log('✅ 최종 반환할 봇:', bots.map(b => `${b.id}(${b.source})`));

    return NextResponse.json({ bots }, { status: 200 });
  } catch (error) {
    console.error("❌ 할당된 봇 조회 오류:", error);
    return NextResponse.json(
      { error: "할당된 봇 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
