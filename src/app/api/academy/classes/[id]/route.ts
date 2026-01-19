import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                grade: true,
                studentId: true,
              },
            },
          },
        },
        schedules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "수업을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ class: classData });
  } catch (error) {
    console.error("수업 조회 실패:", error);
    return NextResponse.json(
      { error: "수업 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

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
    const { name, grade, description, teacherId, capacity, isActive } = body;

    // 수업 확인
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
      select: { academyId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "수업을 찾을 수 없습니다." }, { status: 404 });
    }

    // DIRECTOR는 자기 학원 수업만 수정 가능
    if (role === "DIRECTOR" && existingClass.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: {
        name,
        grade,
        description,
        teacherId: teacherId || null,
        capacity,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error("수업 수정 실패:", error);
    return NextResponse.json(
      { error: "수업 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // 수업 확인
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
      select: { academyId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "수업을 찾을 수 없습니다." }, { status: 404 });
    }

    // DIRECTOR는 자기 학원 수업만 삭제 가능
    if (role === "DIRECTOR" && existingClass.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 수업 삭제 (CASCADE로 연결된 데이터도 삭제됨)
    await prisma.class.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("수업 삭제 실패:", error);
    return NextResponse.json(
      { error: "수업 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
