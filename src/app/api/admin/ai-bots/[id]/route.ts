import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 특정 AI 봇 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const bot = await prisma.aIBot.findUnique({
      where: { id: params.id },
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

    if (!bot) {
      return NextResponse.json({ error: "봇을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ bot }, { status: 200 });
  } catch (error) {
    console.error("❌ AI 봇 조회 오류:", error);
    return NextResponse.json(
      { error: "AI 봇 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: AI 봇 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      nameEn,
      description,
      icon,
      color,
      bgGradient,
      systemPrompt,
      isActive,
    } = body;

    // 봇 존재 확인
    const existingBot = await prisma.aIBot.findUnique({
      where: { id: params.id },
    });

    if (!existingBot) {
      return NextResponse.json({ error: "봇을 찾을 수 없습니다" }, { status: 404 });
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (bgGradient !== undefined) updateData.bgGradient = bgGradient;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (isActive !== undefined) updateData.isActive = isActive;

    // 봇 업데이트
    const updatedBot = await prisma.aIBot.update({
      where: { id: params.id },
      data: updateData,
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
      { message: "AI 봇이 수정되었습니다", bot: updatedBot },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ AI 봇 수정 오류:", error);
    return NextResponse.json(
      { error: "AI 봇 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: AI 봇 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 봇 존재 확인
    const bot = await prisma.aIBot.findUnique({
      where: { id: params.id },
    });

    if (!bot) {
      return NextResponse.json({ error: "봇을 찾을 수 없습니다" }, { status: 404 });
    }

    // 봇 삭제
    await prisma.aIBot.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "AI 봇이 삭제되었습니다" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ AI 봇 삭제 오류:", error);
    return NextResponse.json(
      { error: "AI 봇 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
