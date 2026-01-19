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

    const { role, academyId } = session.user;

    if (role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { aiChatEnabled, aiHomeworkEnabled, aiStudyEnabled } = body;

    // 학생 확인
    const student = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        role: true,
        academyId: true,
      },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "학생을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // DIRECTOR는 자기 학원 학생만 관리 가능
    if (role === "DIRECTOR" && student.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // AI 권한 업데이트
    const updateData: any = {};
    if (aiChatEnabled !== undefined) updateData.aiChatEnabled = aiChatEnabled;
    if (aiHomeworkEnabled !== undefined) updateData.aiHomeworkEnabled = aiHomeworkEnabled;
    if (aiStudyEnabled !== undefined) updateData.aiStudyEnabled = aiStudyEnabled;

    const updatedStudent = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("AI 권한 업데이트 실패:", error);
    return NextResponse.json(
      { error: "AI 권한 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
