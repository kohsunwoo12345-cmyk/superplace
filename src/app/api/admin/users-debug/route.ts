import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 디버그 전용 API - 인증 없이 데이터베이스 상태 확인
 * 프로덕션에서는 제거해야 함
 */
export async function GET(request: NextRequest) {
  const debug: any = {
    timestamp: new Date().toISOString(),
    step: "",
    success: false,
    data: {},
    error: null,
  };

  try {
    // Step 1: 환경 변수 확인
    debug.step = "1. 환경 변수 확인";
    debug.data.env = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      databaseUrlStart: process.env.DATABASE_URL?.substring(0, 20) || "",
      nodeEnv: process.env.NODE_ENV,
    };

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
    }

    // Step 2: Prisma 연결 테스트
    debug.step = "2. Prisma 연결 테스트";
    await prisma.$connect();
    debug.data.prismaConnected = true;

    // Step 3: 간단한 쿼리 테스트
    debug.step = "3. 데이터베이스 쿼리 테스트";
    const userCount = await prisma.user.count();
    debug.data.userCount = userCount;

    // Step 4: 샘플 사용자 조회
    debug.step = "4. 샘플 사용자 조회";
    const sampleUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });
    debug.data.sampleUsers = sampleUsers;

    // Step 5: 전체 사용자 조회 (관리자 페이지와 동일한 쿼리)
    debug.step = "5. 전체 사용자 조회";
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        approved: true,
        cloudflareUserId: true,
        academy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
        studentId: true,
        studentCode: true,
        grade: true,
        parentPhone: true,
        phone: true,
        _count: {
          select: {
            learningProgress: true,
            assignments: true,
            testScores: true,
            attendances: true,
            homeworkSubmissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    debug.data.totalUsers = users.length;
    debug.data.users = users;
    debug.success = true;
    debug.step = "✅ 완료";

    return NextResponse.json({
      success: true,
      message: "데이터베이스 연결 및 쿼리 성공",
      debug,
    });
  } catch (error: any) {
    console.error(`❌ 에러 발생 (${debug.step}):`, error);
    
    debug.success = false;
    debug.error = {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split("\n").slice(0, 5),
    };

    return NextResponse.json(
      {
        success: false,
        message: `데이터베이스 오류 발생 (${debug.step})`,
        debug,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
