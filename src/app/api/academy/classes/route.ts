import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    if (role !== "SUPER_ADMIN" && role !== "DIRECTOR" && role !== "TEACHER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const whereClause: any = {
      isActive: true,
    };

    // DIRECTOR와 TEACHER는 자기 학원 수업만 조회
    if (role === "DIRECTOR" || role === "TEACHER") {
      whereClause.academyId = academyId;
    }

    const classes = await prisma.class.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        grade: true,
        description: true,
        teacherId: true,
        capacity: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
            schedules: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("수업 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "수업 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { name, grade, description, teacherId, capacity } = body;

    if (!name) {
      return NextResponse.json({ error: "수업 이름이 필요합니다." }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        academyId: academyId!,
        name,
        grade,
        description,
        teacherId,
        capacity: capacity || 20,
      },
    });

    return NextResponse.json({ success: true, class: newClass });
  } catch (error) {
    console.error("수업 생성 실패:", error);
    return NextResponse.json(
      { error: "수업 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
