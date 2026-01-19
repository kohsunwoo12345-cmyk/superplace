import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId, id: userId } = session.user;

    if (role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { approved } = body;

    // 선생님 확인
    const teacher = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        role: true,
        academyId: true,
      },
    });

    if (!teacher || teacher.role !== "TEACHER") {
      return NextResponse.json(
        { error: "선생님을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // DIRECTOR는 자기 학원 선생님만 승인 가능
    if (role === "DIRECTOR" && teacher.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 승인 업데이트
    const updatedTeacher = await prisma.user.update({
      where: { id: params.id },
      data: {
        approved,
        approvedBy: approved ? userId : null,
        approvedAt: approved ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, teacher: updatedTeacher });
  } catch (error) {
    console.error("선생님 승인 처리 실패:", error);
    return NextResponse.json(
      { error: "승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
