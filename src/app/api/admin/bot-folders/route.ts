import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/bot-folders
 * 봇 폴더 목록 조회
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

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("폴더 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bot-folders
 * 새 폴더 생성
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
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "폴더 이름은 필수입니다" },
        { status: 400 }
      );
    }

    const newFolder = await prisma.botFolder.create({
      data: {
        name,
        description: description || "",
        color: color || "#3B82F6",
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            bots: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "폴더가 생성되었습니다",
      folder: newFolder,
    });
  } catch (error) {
    console.error("폴더 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bot-folders
 * 폴더 수정 (id를 쿼리 파라미터로 받음)
 */
export async function PATCH(request: NextRequest) {
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
    const folderId = searchParams.get("id");

    if (!folderId) {
      return NextResponse.json(
        { error: "폴더 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const folder = await prisma.botFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "폴더를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (folder.userId !== session.user.id) {
      return NextResponse.json(
        { error: "폴더 접근 권한이 없습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color } = body;

    const updatedFolder = await prisma.botFolder.update({
      where: { id: folderId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
      },
      include: {
        _count: {
          select: {
            bots: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "폴더가 수정되었습니다",
      folder: updatedFolder,
    });
  } catch (error) {
    console.error("폴더 수정 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bot-folders
 * 폴더 삭제 (id를 쿼리 파라미터로 받음)
 */
export async function DELETE(request: NextRequest) {
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
    const folderId = searchParams.get("id");

    if (!folderId) {
      return NextResponse.json(
        { error: "폴더 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const folder = await prisma.botFolder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: {
            bots: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "폴더를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (folder.userId !== session.user.id) {
      return NextResponse.json(
        { error: "폴더 접근 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 폴더 안에 봇이 있는 경우
    if (folder._count.bots > 0) {
      return NextResponse.json(
        {
          error: "폴더 안에 봇이 있습니다. 먼저 봇을 이동하거나 삭제해주세요",
          botCount: folder._count.bots,
        },
        { status: 400 }
      );
    }

    await prisma.botFolder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({
      message: "폴더가 삭제되었습니다",
    });
  } catch (error) {
    console.error("폴더 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
