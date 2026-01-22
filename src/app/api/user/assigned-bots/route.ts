import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GEMS_DATA } from "@/lib/gems/data";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;

    // 할당된 봇 조회
    const assignments = await prisma.botAssignment.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        botId: true,
      },
    });

    // botId로 gems 데이터 매핑
    const bots = assignments.map((assignment) => {
      const gemData = GEMS_DATA.find((gem) => gem.id === assignment.botId);
      return gemData
        ? {
            id: gemData.id,
            name: gemData.name,
            icon: gemData.icon,
          }
        : null;
    }).filter(Boolean);

    return NextResponse.json({ bots }, { status: 200 });
  } catch (error) {
    console.error("❌ 할당된 봇 조회 중 오류:", error);
    return NextResponse.json(
      { error: "할당된 봇을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
