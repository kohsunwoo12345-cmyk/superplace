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

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const pendingUsers = await prisma.user.findMany({
      where: {
        approved: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users: pendingUsers });
  } catch (error) {
    console.error("Get pending users error:", error);
    return NextResponse.json(
      { error: "대기 중인 사용자 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
