import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 테스트 사용자 자동 생성 API
 * 데이터베이스가 비어있을 때 초기 사용자 생성
 */
export async function POST() {
  try {
    // 환경 변수 확인
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Prisma 연결
    await prisma.$connect();

    // 기존 사용자 수 확인
    const existingCount = await prisma.user.count();

    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: "이미 사용자가 존재합니다.",
        existingCount,
      });
    }

    // 관리자 비밀번호 해시
    const adminPassword = await bcrypt.hash("admin123!@#", 10);

    // 관리자 생성
    const admin = await prisma.user.create({
      data: {
        email: "admin@superplace.com",
        name: "System Administrator",
        password: adminPassword,
        role: "SUPER_ADMIN",
        approved: true,
        emailVerified: new Date(),
      },
    });

    // 테스트 학생 비밀번호 해시
    const studentPassword = await bcrypt.hash("student123", 10);

    // 테스트 학생들 생성
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const student = await prisma.user.create({
        data: {
          email: `student${i}@test.com`,
          name: `테스트 학생${i}`,
          password: studentPassword,
          role: "STUDENT",
          grade: `중${i}`,
          studentCode: `ST00${i}`,
          approved: true,
          aiChatEnabled: true,
          aiHomeworkEnabled: true,
          aiStudyEnabled: true,
          points: i * 10,
        },
      });
      students.push(student);
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "초기 사용자가 생성되었습니다.",
      created: {
        admin: 1,
        students: students.length,
        total: students.length + 1,
      },
      users: [
        { email: admin.email, name: admin.name, role: admin.role },
        ...students.map((s) => ({
          email: s.email,
          name: s.name,
          role: s.role,
        })),
      ],
    });
  } catch (error: any) {
    console.error("초기 사용자 생성 실패:", error);
    return NextResponse.json(
      {
        error: "초기 사용자 생성 실패",
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

/**
 * 현재 사용자 상태 확인
 */
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    await prisma.$connect();

    const count = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      count,
      needsInitialData: count === 0,
      users,
      hint:
        count === 0
          ? "POST 요청으로 초기 사용자를 생성하세요."
          : "사용자가 이미 존재합니다.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "사용자 조회 실패",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
