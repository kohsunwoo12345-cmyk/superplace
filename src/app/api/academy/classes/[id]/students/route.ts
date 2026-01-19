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

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    if (role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "학생 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 수업 확인
    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      select: {
        academyId: true,
        capacity: true,
        _count: { select: { students: true } },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "수업을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 체크
    if (role === "DIRECTOR" && classData.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 정원 체크
    if (classData._count.students >= classData.capacity) {
      return NextResponse.json(
        { error: "수업 정원이 가득 찼습니다." },
        { status: 400 }
      );
    }

    // 학생 확인
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true, academyId: true },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "학생을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 같은 학원 학생인지 확인
    if (role === "DIRECTOR" && student.academyId !== academyId) {
      return NextResponse.json(
        { error: "다른 학원 학생입니다." },
        { status: 403 }
      );
    }

    // 이미 등록된 학생인지 확인
    const existing = await prisma.studentClass.findFirst({
      where: {
        studentId,
        classId: params.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 학생입니다." },
        { status: 400 }
      );
    }

    // 학생 등록
    const studentClass = await prisma.studentClass.create({
      data: {
        studentId,
        classId: params.id,
      },
    });

    return NextResponse.json({ success: true, studentClass });
  } catch (error) {
    console.error("학생 등록 실패:", error);
    return NextResponse.json(
      { error: "학생 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
