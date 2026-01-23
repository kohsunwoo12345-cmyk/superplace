import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 모든 AI 봇 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // SUPER_ADMIN만 접근 가능
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const bots = await prisma.aIBot.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bots }, { status: 200 });
  } catch (error) {
    console.error("❌ AI 봇 조회 오류:", error);
    return NextResponse.json(
      { error: "AI 봇 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 AI 봇 생성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // SUPER_ADMIN만 접근 가능
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await req.json();
    const {
      botId,
      name,
      nameEn,
      description,
      icon,
      color,
      bgGradient,
      systemPrompt,
      isActive,
    } = body;

    // 필수 필드 검증
    if (!botId || !name || !nameEn || !description || !systemPrompt) {
      return NextResponse.json(
        { error: "필수 필드를 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // botId 중복 확인
    const existingBot = await prisma.aIBot.findUnique({
      where: { botId },
    });

    if (existingBot) {
      return NextResponse.json(
        { error: "이미 존재하는 봇 ID입니다" },
        { status: 400 }
      );
    }

    // AI 봇 생성
    const bot = await prisma.aIBot.create({
      data: {
        botId,
        name,
        nameEn,
        description,
        icon: icon || "🤖",
        color: color || "blue",
        bgGradient: bgGradient || "from-blue-50 to-cyan-50",
        systemPrompt,
        isActive: isActive !== undefined ? isActive : true,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "AI 봇이 생성되었습니다", bot },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ AI 봇 생성 오류:", error);
    return NextResponse.json(
      { error: "AI 봇 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
