import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; studentClassId: string } }
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

    // StudentClass 확인
    const studentClass = await prisma.studentClass.findUnique({
      where: { id: params.studentClassId },
      include: {
        class: { select: { academyId: true } },
      },
    });

    if (!studentClass) {
      return NextResponse.json(
        { error: "등록 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    if (role === "DIRECTOR" && studentClass.class.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 학생 제외
    await prisma.studentClass.delete({
      where: { id: params.studentClassId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("학생 제외 실패:", error);
    return NextResponse.json(
      { error: "학생 제외 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
