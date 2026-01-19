import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    if (role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 시간표 확인
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: params.scheduleId },
      include: {
        class: { select: { academyId: true } },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "시간표를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    if (role === "DIRECTOR" && schedule.class.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 시간표 삭제
    await prisma.classSchedule.delete({
      where: { id: params.scheduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("시간표 삭제 실패:", error);
    return NextResponse.json(
      { error: "시간표 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
