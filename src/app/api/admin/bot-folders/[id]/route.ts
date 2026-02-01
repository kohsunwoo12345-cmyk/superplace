import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: 폴더 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, description, color, icon, order } = body;

    const folder = await prisma.botFolder.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bots: true,
      },
    });

    return NextResponse.json(
      { message: "폴더가 수정되었습니다", folder },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 폴더 수정 오류:", error);
    return NextResponse.json(
      { error: "폴더 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 폴더 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // SUPER_ADMIN만 접근 가능
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 폴더에 속한 봇들의 folderId를 null로 업데이트
    await prisma.aIBot.updateMany({
      where: { folderId: params.id },
      data: { folderId: null },
    });

    // 폴더 삭제
    await prisma.botFolder.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "폴더가 삭제되었습니다" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 폴더 삭제 오류:", error);
    return NextResponse.json(
      { error: "폴더 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
