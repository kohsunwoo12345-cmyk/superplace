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
      },
      select: {
        botId: true,
      },
    });

    const assignedBotIds = assignments.map(a => a.botId);

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
      },
    });

    // DB 봇을 표준 형식으로 변환
    const bots = dbBots.map((bot) => ({
      id: bot.botId,
      name: bot.name,
      nameEn: bot.nameEn,
      description: bot.description,
      icon: bot.icon,
      color: bot.color,
      bgGradient: bot.bgGradient,
      systemPrompt: bot.systemPrompt,
      source: "database" as const,
    }));

    return NextResponse.json({ bots }, { status: 200 });
  } catch (error) {
    console.error("❌ 할당된 봇 조회 오류:", error);
    return NextResponse.json(
      { error: "할당된 봇 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
