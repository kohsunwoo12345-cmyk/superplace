import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

    const urls = await prisma.shortUrl.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Get short URLs error:", error);
    return NextResponse.json(
      { error: "URL 목록 조회 중 오류가 발생했습니다" },
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

    const { originalUrl, title } = await req.json();

    if (!originalUrl) {
      return NextResponse.json(
        { error: "URL을 입력해주세요" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    let existing = await prisma.shortUrl.findUnique({
      where: { shortCode },
    });

    while (existing) {
      shortCode = generateShortCode();
      existing = await prisma.shortUrl.findUnique({
        where: { shortCode },
      });
    }

    const shortUrl = await prisma.shortUrl.create({
      data: {
        userId: user.id,
        shortCode,
        originalUrl,
        title,
      },
    });

    return NextResponse.json({ ...shortUrl });
  } catch (error) {
    console.error("Create short URL error:", error);
    return NextResponse.json(
      { error: "URL 단축 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
