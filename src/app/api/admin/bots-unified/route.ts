import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/bots-unified
 * 통합 AI 봇 목록 조회 (폴더별, 검색, 필터링)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    // SUPER_ADMIN만 접근 가능
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const folderId = searchParams.get("folderId") || "all";
    const isActive = searchParams.get("isActive");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 폴더 목록 조회
    const folders = await prisma.botFolder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            bots: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 봇 목록 조회 조건
    const whereCondition: any = {};

    // 검색어 필터
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { botId: { contains: search, mode: "insensitive" } },
      ];
    }

    // 폴더 필터
    if (folderId !== "all") {
      if (folderId === "none") {
        whereCondition.folderId = null;
      } else {
        whereCondition.folderId = folderId;
      }
    }

    // 활성화 상태 필터
    if (isActive !== null && isActive !== undefined && isActive !== "") {
      whereCondition.isActive = isActive === "true";
    }

    // 봇 목록 조회
    const bots = await prisma.aIBot.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                academy: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
            grantedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            assignedAt: "desc",
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder === "desc" ? "desc" : "asc",
      },
    });

    // 통계 계산
    const totalBots = bots.length;
    const activeBots = bots.filter((b) => b.isActive).length;
    const inactiveBots = totalBots - activeBots;
    const totalAssignments = bots.reduce((sum, b) => sum + b._count.assignments, 0);

    return NextResponse.json({
      bots,
      folders,
      stats: {
        totalBots,
        activeBots,
        inactiveBots,
        totalAssignments,
        totalFolders: folders.length,
      },
    });
  } catch (error) {
    console.error("통합 봇 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bots-unified
 * 새 AI 봇 추가
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    // SUPER_ADMIN만 접근 가능
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      botId,
      name,
      nameEn,
      description,
      icon,
      color,
      bgGradient,
      systemPrompt,
      referenceFiles,
      starterMessages,
      enableImageInput,
      enableVoiceOutput,
      enableVoiceInput,
      isActive,
      folderId,
    } = body;

    // 필수 필드 검증
    if (!botId || !name || !nameEn || !description || !systemPrompt) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    // botId 중복 검사
    const existingBot = await prisma.aIBot.findUnique({
      where: { botId },
    });

    if (existingBot) {
      return NextResponse.json(
        { error: "이미 존재하는 봇 ID입니다" },
        { status: 400 }
      );
    }

    // 폴더 존재 확인 (folderId가 제공된 경우)
    if (folderId) {
      const folder = await prisma.botFolder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "존재하지 않는 폴더입니다" },
          { status: 400 }
        );
      }

      // 폴더 소유자 확인
      if (folder.userId !== session.user.id) {
        return NextResponse.json(
          { error: "폴더 접근 권한이 없습니다" },
          { status: 403 }
        );
      }
    }

    // 새 봇 생성
    const newBot = await prisma.aIBot.create({
      data: {
        botId,
        name,
        nameEn,
        description,
        icon: icon || "🤖",
        color: color || "blue",
        bgGradient: bgGradient || "from-blue-50 to-cyan-50",
        systemPrompt,
        referenceFiles: referenceFiles || [],
        starterMessages: starterMessages || [],
        enableImageInput: enableImageInput || false,
        enableVoiceOutput: enableVoiceOutput || false,
        enableVoiceInput: enableVoiceInput || false,
        isActive: isActive !== undefined ? isActive : true,
        createdById: session.user.id,
        folderId: folderId || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "AI 봇이 생성되었습니다",
      bot: newBot,
    });
  } catch (error) {
    console.error("AI 봇 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
