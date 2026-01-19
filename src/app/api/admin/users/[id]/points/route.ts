import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, reason } = body;

    if (typeof amount !== "number") {
      return NextResponse.json(
        { error: "유효하지 않은 포인트 금액입니다." },
        { status: 400 }
      );
    }

    // 트랜잭션으로 포인트 업데이트 및 이력 생성
    const result = await prisma.$transaction(async (tx) => {
      // 현재 사용자 조회
      const user = await tx.user.findUnique({
        where: { id: params.id },
        select: { points: true },
      });

      if (!user) {
        throw new Error("사용자를 찾을 수 없습니다.");
      }

      // 포인트가 음수가 되지 않도록 체크
      const newPoints = user.points + amount;
      if (newPoints < 0) {
        throw new Error("포인트가 부족합니다.");
      }

      // 포인트 업데이트
      const updatedUser = await tx.user.update({
        where: { id: params.id },
        data: {
          points: newPoints,
        },
      });

      // 포인트 이력 생성
      await tx.pointHistory.create({
        data: {
          userId: params.id,
          amount,
          type: amount > 0 ? "EARNED" : "SPENT",
          reason: reason || "관리자 지급/회수",
          description: `관리자가 ${amount > 0 ? "지급" : "회수"}한 포인트`,
          balance: newPoints,
        },
      });

      return updatedUser;
    });

    return NextResponse.json({ success: true, user: result });
  } catch (error: any) {
    console.error("포인트 처리 실패:", error);
    return NextResponse.json(
      { error: error.message || "포인트 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
