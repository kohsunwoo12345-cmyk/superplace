import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/materials/[id]/view
 * 학습 자료 조회수 증가
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = params;

    // 조회수 증가
    await prisma.learningMaterial.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // 학습 진행도 업데이트 (없으면 생성)
    const existingProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId: id,
        },
      },
    });

    if (!existingProgress) {
      // 첫 접근: IN_PROGRESS로 생성
      await prisma.learningProgress.create({
        data: {
          userId: session.user.id,
          materialId: id,
          status: "IN_PROGRESS",
          progress: 0,
          timeSpent: 0,
        },
      });
    } else {
      // 마지막 접근 시간 업데이트
      await prisma.learningProgress.update({
        where: {
          userId_materialId: {
            userId: session.user.id,
            materialId: id,
          },
        },
        data: {
          lastAccessedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ 조회수 업데이트 오류:", error);
    return NextResponse.json(
      { error: "조회수 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
