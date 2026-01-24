import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/bots-unified/[botId]
 * 특정 AI 봇 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
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

    const { botId } = params;

    const bot = await prisma.aIBot.findUnique({
      where: { botId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
                role: true,
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
    });

    if (!bot) {
      return NextResponse.json(
        { error: "봇을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 할당 통계
    const assignmentStats = {
      total: bot.assignments.length,
      active: bot.assignments.filter((a) => a.isActive).length,
      expired: bot.assignments.filter(
        (a) => a.expiresAt && new Date(a.expiresAt) < new Date()
      ).length,
      byRole: {
        DIRECTOR: bot.assignments.filter((a) => a.user.role === "DIRECTOR").length,
        TEACHER: bot.assignments.filter((a) => a.user.role === "TEACHER").length,
        STUDENT: bot.assignments.filter((a) => a.user.role === "STUDENT").length,
      },
    };

    return NextResponse.json({
      bot,
      assignmentStats,
    });
  } catch (error) {
    console.error("봇 상세 정보 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bots-unified/[botId]
 * AI 봇 정보 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
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

    const { botId } = params;
    const body = await request.json();

    const existingBot = await prisma.aIBot.findUnique({
      where: { botId },
    });

    if (!existingBot) {
      return NextResponse.json(
        { error: "봇을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 폴더 변경 시 폴더 존재 및 권한 확인
    if (body.folderId !== undefined && body.folderId !== null) {
      const folder = await prisma.botFolder.findUnique({
        where: { id: body.folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "존재하지 않는 폴더입니다" },
          { status: 400 }
        );
      }

      if (folder.userId !== session.user.id) {
        return NextResponse.json(
          { error: "폴더 접근 권한이 없습니다" },
          { status: 403 }
        );
      }
    }

    // 수정할 필드만 추출
    const updateData: any = {};
    const allowedFields = [
      "name",
      "nameEn",
      "description",
      "icon",
      "color",
      "bgGradient",
      "systemPrompt",
      "referenceFiles",
      "starterMessages",
      "enableImageInput",
      "enableVoiceOutput",
      "enableVoiceInput",
      "isActive",
      "folderId",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedBot = await prisma.aIBot.update({
      where: { botId },
      data: updateData,
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
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "AI 봇 정보가 수정되었습니다",
      bot: updatedBot,
    });
  } catch (error) {
    console.error("AI 봇 수정 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bots-unified/[botId]
 * AI 봇 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
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

    const { botId } = params;

    const existingBot = await prisma.aIBot.findUnique({
      where: { botId },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    if (!existingBot) {
      return NextResponse.json(
        { error: "봇을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 할당된 봇인 경우 경고
    if (existingBot._count.assignments > 0) {
      return NextResponse.json(
        {
          error: "이 봇은 사용자에게 할당되어 있습니다",
          assignmentCount: existingBot._count.assignments,
        },
        { status: 400 }
      );
    }

    await prisma.aIBot.delete({
      where: { botId },
    });

    return NextResponse.json({
      message: "AI 봇이 삭제되었습니다",
    });
  } catch (error) {
    console.error("AI 봇 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
