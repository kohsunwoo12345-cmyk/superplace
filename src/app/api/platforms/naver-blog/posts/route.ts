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
      include: {
        naverBlog: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ posts: user.naverBlog });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "포스트 조회 중 오류가 발생했습니다" },
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

    const { title, content, status = "DRAFT" } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    const post = await prisma.naverBlog.create({
      data: {
        title,
        content,
        status,
        userId: user.id,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "포스트 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
