import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 모든 폴더 조회
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

    const folders = await prisma.botFolder.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bots: {
          select: {
            id: true,
            name: true,
            icon: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({ folders }, { status: 200 });
  } catch (error) {
    console.error("❌ 폴더 조회 오류:", error);
    return NextResponse.json(
      { error: "폴더 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 폴더 생성
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
    const { name, description, color, icon, order } = body;

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: "폴더명을 입력해주세요" },
        { status: 400 }
      );
    }

    // 폴더 생성
    const folder = await prisma.botFolder.create({
      data: {
        name,
        description: description || null,
        color: color || "#3B82F6",
        icon: icon || "Folder",
        order: order || 0,
        createdBy: session.user.id,
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
      { message: "폴더가 생성되었습니다", folder },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ 폴더 생성 오류:", error);
    return NextResponse.json(
      { error: "폴더 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
