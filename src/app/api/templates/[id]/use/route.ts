import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    await prisma.contentTemplate.update({
      where: { id },
      data: {
        timesUsed: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update template usage error:", error);
    return NextResponse.json(
      { error: "사용 횟수 업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
