import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { role, academyId } = session.user;

    // 2. 권한 확인 (DIRECTOR 또는 SUPER_ADMIN만 가능)
    if (role !== "DIRECTOR" && role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "학원장 권한이 필요합니다" },
        { status: 403 }
      );
    }

    if (role === "DIRECTOR" && !academyId) {
      return NextResponse.json(
        { error: "학원 정보를 찾을 수 없습니다" },
        { status: 400 }
      );
    }

    // 3. 요청 데이터 파싱
    const body = await req.json();
    const { name, email, password, phone, subject } = body;

    // 4. 필수 필드 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "이름, 이메일, 비밀번호는 필수 입력 항목입니다" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 최소 8자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    // 5. 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 존재하는 이메일입니다" },
        { status: 400 }
      );
    }

    // 6. 학원 정보 확인 및 선생님 수 제한 체크
    const targetAcademyId = role === "SUPER_ADMIN" ? academyId : academyId;
    const academy = await prisma.academy.findUnique({
      where: { id: targetAcademyId! },
      include: {
        users: {
          where: { role: "TEACHER" },
        },
      },
    });

    if (!academy) {
      return NextResponse.json(
        { error: "학원 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 선생님 수 제한 체크
    const currentTeacherCount = academy.users.length;
    if (currentTeacherCount >= academy.maxTeachers) {
      return NextResponse.json(
        { 
          error: `선생님 정원이 가득 찼습니다. 현재: ${currentTeacherCount}/${academy.maxTeachers}명`,
          currentCount: currentTeacherCount,
          maxCount: academy.maxTeachers
        },
        { status: 400 }
      );
    }

    // 7. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8. 선생님 생성 (자동 승인)
    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: "TEACHER",
        academyId: targetAcademyId,
        approved: true, // 학원장이 직접 생성하므로 자동 승인
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    });

    console.log("✅ 선생님 계정 생성 성공:", teacher);

    return NextResponse.json(
      {
        success: true,
        message: "선생님 계정이 생성되었습니다",
        teacher,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ 선생님 생성 중 오류:", error);
    return NextResponse.json(
      { error: "선생님 계정 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
