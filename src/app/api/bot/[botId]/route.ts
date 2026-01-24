import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { botId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // URL 디코딩
    const botId = decodeURIComponent(params.botId);
    
    console.log('🔍 봇 조회 요청:', { botId, userId: session.user.id, role: session.user.role });

    // 봇 정보 조회
    const bot = await prisma.aIBot.findUnique({
      where: {
        botId,
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
        starterMessages: true,
        enableImageInput: true,
        enableVoiceOutput: true,
        enableVoiceInput: true,
        isActive: true,
      },
    });

    console.log('🤖 봇 조회 결과:', bot ? `찾음: ${bot.name}` : '찾지 못함');

    if (!bot) {
      return NextResponse.json(
        { error: "봇을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!bot.isActive) {
      return NextResponse.json(
        { error: "비활성화된 봇입니다." },
        { status: 403 }
      );
    }

    // 권한 체크: 관리자가 아닌 경우 할당 여부 확인
    if (session.user.role !== "SUPER_ADMIN") {
      const assignment = await prisma.botAssignment.findFirst({
        where: {
          userId: session.user.id,
          botId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      console.log('🔐 권한 체크:', assignment ? '할당됨' : '할당 안됨');

      if (!assignment) {
        return NextResponse.json(
          { error: "이 봇에 대한 접근 권한이 없습니다." },
          { status: 403 }
        );
      }
    }

    console.log('✅ 봇 정보 반환 성공');

    return NextResponse.json({
      success: true,
      bot,
    });
  } catch (error) {
    console.error("봇 정보 조회 오류:", error);
    return NextResponse.json(
      { error: "봇 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
