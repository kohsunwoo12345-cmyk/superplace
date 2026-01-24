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

    console.log('🔍 통합 봇 관리 API 호출 - 사용자:', session.user.email);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const folderId = searchParams.get("folderId") || "all";
    const isActive = searchParams.get("isActive");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    console.log('📊 쿼리 파라미터:', { search, folderId, isActive, sortBy, sortOrder });

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

    console.log('📁 폴더 수:', folders.length);

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

    console.log('🔎 조회 조건:', JSON.stringify(whereCondition, null, 2));

    // 봇 목록 조회
    const bots = await prisma.aIBot.findMany({
      where: whereCondition,
      include: {
        createdBy: {
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
      orderBy: {
        [sortBy]: sortOrder === "desc" ? "desc" : "asc",
      },
    });

    console.log('🤖 조회된 봇 수:', bots.length);
    if (bots.length > 0) {
      console.log('첫 번째 봇:', bots[0].name, bots[0].botId);
    }

    // 각 봇의 할당 정보를 별도로 조회
    const botsWithAssignments = await Promise.all(
      bots.map(async (bot) => {
        try {
          const assignments = await prisma.botAssignment.findMany({
            where: {
              botId: bot.botId,
            },
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
              createdAt: "desc",
            },
          });

          return {
            ...bot,
            assignments,
            _count: {
              assignments: assignments.length,
            },
          };
        } catch (assignmentError) {
          console.error('❌ 할당 조회 오류 (봇:', bot.botId, '):', assignmentError);
          return {
            ...bot,
            assignments: [],
            _count: {
              assignments: 0,
            },
          };
        }
      })
    );

    console.log('✅ 할당 정보 포함 봇 수:', botsWithAssignments.length);

    // 통계 계산
    const totalBots = botsWithAssignments.length;
    const activeBots = botsWithAssignments.filter((b) => b.isActive).length;
    const inactiveBots = totalBots - activeBots;
    const totalAssignments = botsWithAssignments.reduce((sum, b) => sum + b._count.assignments, 0);

    console.log('📈 통계:', {
      totalBots,
      activeBots,
      inactiveBots,
      totalAssignments,
      totalFolders: folders.length
    });

    // JSON 직렬화를 위해 Date 객체를 문자열로 변환
    const serializedBots = botsWithAssignments.map(bot => ({
      ...bot,
      createdAt: bot.createdAt.toISOString(),
      updatedAt: bot.updatedAt.toISOString(),
      assignments: bot.assignments.map(assignment => ({
        ...assignment,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        expiresAt: assignment.expiresAt ? assignment.expiresAt.toISOString() : null,
      })),
    }));

    const serializedFolders = folders.map(folder => ({
      ...folder,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    }));

    console.log('✅ 응답 준비 완료 - 봇:', serializedBots.length, '폴더:', serializedFolders.length);

    return NextResponse.json({
      bots: serializedBots,
      folders: serializedFolders,
      stats: {
        totalBots,
        activeBots,
        inactiveBots,
        totalAssignments,
        totalFolders: folders.length,
      },
    });
  } catch (error) {
    console.error("❌ 통합 봇 목록 조회 오류:", error);
    console.error("에러 상세:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("스택:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "서버 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error)
      },
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
        createdBy: {
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
