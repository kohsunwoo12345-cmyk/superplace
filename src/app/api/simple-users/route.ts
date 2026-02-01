import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 간단한 사용자 목록 API (디버그용)
 * 인증 없음, 최소한의 쿼리
 */
export async function GET() {
  try {
    console.log("🔍 [Simple Users API] 시작");

    // 환경 변수 확인
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL 없음");
      return NextResponse.json(
        {
          error: "DATABASE_URL 환경 변수가 설정되지 않았습니다.",
          hint: "Vercel 환경 변수를 확인하세요.",
        },
        { status: 500 }
      );
    }

    console.log("✅ DATABASE_URL 확인됨");

    // Prisma 연결
    await prisma.$connect();
    console.log("✅ Prisma 연결 성공");

    // 사용자 수 확인
    const count = await prisma.user.count();
    console.log(`✅ 사용자 수: ${count}명`);

    // 간단한 사용자 목록 (복잡한 관계 제외)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
      },
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ 사용자 ${users.length}명 조회 완료`);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      count,
      users,
    });
  } catch (error: any) {
    console.error("❌ 에러:", error);
    
    return NextResponse.json(
      {
        error: error.message,
        name: error.name,
        code: error.code,
        details: error.meta,
      },
      { status: 500 }
    );
  }
}
