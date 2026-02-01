import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { triggerClassSync } from "@/lib/auto-sync";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/classes/manage
 * 반 목록 조회 (학원장/선생님/관리자)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    // SUPER_ADMIN, DIRECTOR, TEACHER만 접근 가능
    if (!["SUPER_ADMIN", "DIRECTOR", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 학원 필터 조건
    const academyFilter = role === "SUPER_ADMIN" ? {} : { academyId };

    // 반 목록 조회
    const classes = await prisma.class.findMany({
      where: academyFilter,
      include: {
        students: {
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
          },
          where: {
            status: "ACTIVE",
          },
        },
        schedules: {
          where: {
            isActive: true,
          },
          orderBy: {
            dayOfWeek: "asc",
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error("❌ 반 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "반 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes/manage
 * 새 반 생성
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { role, academyId } = session.user;

    // SUPER_ADMIN, DIRECTOR만 생성 가능
    if (!["SUPER_ADMIN", "DIRECTOR"].includes(role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { name, grade, description, teacherId, capacity } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "반 이름은 필수입니다." }, { status: 400 });
    }

    // 반 생성
    const newClass = await prisma.class.create({
      data: {
        academyId: role === "SUPER_ADMIN" && academyId ? academyId : session.user.academyId!,
        name,
        grade: grade || null,
        description: description || null,
        teacherId: teacherId || null,
        capacity: capacity || 20,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      class: newClass,
    });
  } catch (error) {
    console.error("❌ 반 생성 오류:", error);
    return NextResponse.json(
      { error: "반 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
