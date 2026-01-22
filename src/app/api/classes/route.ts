import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { role, academyId } = session.user;

    if (role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "학원장 권한이 필요합니다" }, { status: 403 });
    }

    if (!academyId) {
      return NextResponse.json({ error: "학원 정보를 찾을 수 없습니다" }, { status: 400 });
    }

    const body = await req.json();
    const { name, grade, description, teacherId, capacity } = body;

    if (!name) {
      return NextResponse.json({ error: "수업 이름은 필수입니다" }, { status: 400 });
    }

    // teacherId가 있으면 해당 선생님이 이 학원에 속해있는지 확인
    if (teacherId) {
      const teacher = await prisma.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          academyId: academyId,
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "해당 선생님을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        grade: grade || null,
        description: description || null,
        teacherId: teacherId || null,
        capacity: capacity || 20,
        academyId,
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "수업이 생성되었습니다",
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ 수업 생성 중 오류:", error);
    return NextResponse.json(
      { error: "수업 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 수업 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { academyId } = session.user;

    if (!academyId) {
      return NextResponse.json({ error: "학원 정보를 찾을 수 없습니다" }, { status: 400 });
    }

    const classes = await prisma.class.findMany({
      where: {
        academyId,
        isActive: true,
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                grade: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            schedules: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ classes }, { status: 200 });
  } catch (error) {
    console.error("❌ 수업 목록 조회 중 오류:", error);
    return NextResponse.json(
      { error: "수업 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
