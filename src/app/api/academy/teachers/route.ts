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

    // SUPER_ADMIN은 모든 선생님 조회 가능
    // DIRECTOR는 자기 학원 선생님만 조회 가능
    if (role !== "SUPER_ADMIN" && role !== "DIRECTOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const whereClause: any = {
      role: "TEACHER",
    };

    if (role === "DIRECTOR") {
      whereClause.academyId = academyId;
    }

    const teachers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        approved: true,
        createdAt: true,
        lastLoginAt: true,
        academy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            createdMaterials: true,
            createdAssignments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("선생님 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "선생님 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
