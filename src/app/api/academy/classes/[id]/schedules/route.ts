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
    const { subject, dayOfWeek, startTime, endTime, room } = body;

    if (!subject || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 수업 확인
    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      select: { academyId: true },
    });

    if (!classData) {
      return NextResponse.json({ error: "수업을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 체크
    if (role === "DIRECTOR" && classData.academyId !== academyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 시간표 생성
    const schedule = await prisma.classSchedule.create({
      data: {
        classId: params.id,
        subject,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        room,
      },
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error("시간표 추가 실패:", error);
    return NextResponse.json(
      { error: "시간표 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
