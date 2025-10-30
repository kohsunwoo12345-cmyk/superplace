import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    const templates = await prisma.contentTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json(
      { error: "템플릿 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { name, category, platform, content, tags } = await req.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: "이름과 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    const template = await prisma.contentTemplate.create({
      data: {
        userId: user.id,
        name,
        category,
        platform,
        content,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "템플릿 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
