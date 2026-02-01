import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/classes/[id]/assign
 * 학생을 반에 배정
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

    const { role } = session.user;

    // SUPER_ADMIN, DIRECTOR, TEACHER만 배정 가능
    if (!["SUPER_ADMIN", "DIRECTOR", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const classId = params.id;
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: "학생 ID가 필요합니다." }, { status: 400 });
    }

    // 반 존재 확인
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classInfo) {
      return NextResponse.json({ error: "반을 찾을 수 없습니다." }, { status: 404 });
    }

    // 정원 확인
    if (classInfo._count.students >= classInfo.capacity) {
      return NextResponse.json({ error: "반 정원이 초과되었습니다." }, { status: 400 });
    }

    // 이미 배정되어 있는지 확인
    const existing = await prisma.studentClass.findFirst({
      where: {
        studentId,
        classId,
        status: "ACTIVE",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 이 반에 배정된 학생입니다." },
        { status: 400 }
      );
    }

    // 학생 배정
    const studentClass = await prisma.studentClass.create({
      data: {
        studentId,
        classId,
        status: "ACTIVE",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentCode: true,
            grade: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      assignment: studentClass,
    });
  } catch (error) {
    console.error("❌ 학생 배정 오류:", error);
    return NextResponse.json(
      { error: "학생 배정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]/assign
 * 학생을 반에서 제외
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role } = session.user;

    // SUPER_ADMIN, DIRECTOR, TEACHER만 제외 가능
    if (!["SUPER_ADMIN", "DIRECTOR", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const classId = params.id;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "학생 ID가 필요합니다." }, { status: 400 });
    }

    // 배정 정보 찾기
    const studentClass = await prisma.studentClass.findFirst({
      where: {
        studentId,
        classId,
        status: "ACTIVE",
      },
    });

    if (!studentClass) {
      return NextResponse.json(
        { error: "배정 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상태를 DROPPED로 변경
    await prisma.studentClass.update({
      where: { id: studentClass.id },
      data: { status: "DROPPED" },
    });

    return NextResponse.json({
      success: true,
      message: "학생이 반에서 제외되었습니다.",
    });
  } catch (error) {
    console.error("❌ 학생 제외 오류:", error);
    return NextResponse.json(
      { error: "학생 제외 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
