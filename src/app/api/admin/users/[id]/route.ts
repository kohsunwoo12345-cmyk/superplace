import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        approved: true,
        academy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            aiUsages: true,
            pointHistory: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("사용자 조회 실패:", error);
    return NextResponse.json(
      { error: "사용자 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { points, aiChatEnabled, aiHomeworkEnabled, aiStudyEnabled } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        points,
        aiChatEnabled,
        aiHomeworkEnabled,
        aiStudyEnabled,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("사용자 수정 실패:", error);
    return NextResponse.json(
      { error: "사용자 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
