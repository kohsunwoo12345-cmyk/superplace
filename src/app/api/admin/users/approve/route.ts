import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "사용자 ID가 필요합니다" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        approved: true,
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        approved: user.approved,
      }
    });
  } catch (error) {
    console.error("Approve user error:", error);
    return NextResponse.json(
      { error: "사용자 승인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
