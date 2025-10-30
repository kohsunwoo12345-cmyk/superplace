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

    const posts = await prisma.scheduledPost.findMany({
      where: { userId: user.id },
      orderBy: [
        { status: "asc" }, // PENDING first
        { scheduledFor: "asc" },
      ],
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Get scheduled posts error:", error);
    return NextResponse.json(
      { error: "예약 게시물 조회 중 오류가 발생했습니다" },
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

    const { platform, title, content, scheduledFor, mediaUrls } = await req.json();

    if (!platform || !content || !scheduledFor) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    const scheduledDateTime = new Date(scheduledFor);
    if (scheduledDateTime <= new Date()) {
      return NextResponse.json(
        { error: "예약 시간은 현재 시간보다 이후여야 합니다" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    const post = await prisma.scheduledPost.create({
      data: {
        userId: user.id,
        platform,
        title,
        content,
        scheduledFor: scheduledDateTime,
        mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create scheduled post error:", error);
    return NextResponse.json(
      { error: "게시물 예약 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
