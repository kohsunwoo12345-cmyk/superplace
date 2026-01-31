import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * 
 * 모든 사용자 조회 (Neon PostgreSQL + Cloudflare D1)
 * - 권한 체크 없음 (디버그 모드)
 * - Neon과 D1의 모든 사용자를 병합하여 반환
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log("\n" + "=".repeat(80));
  console.log("🚀 GET /api/admin/users - 시작");
  console.log("=".repeat(80));

  try {
    // Step 1: 세션 확인 (차단하지 않음)
    console.log("\n[Step 1] 세션 확인 중...");
    const session = await getServerSession(authOptions);
    
    if (session) {
      console.log("✅ 세션 존재:", {
        email: session.user?.email,
        role: session.user?.role,
        academyId: session.user?.academyId,
      });
    } else {
      console.log("⚠️ 세션 없음 (계속 진행)");
    }

    // Step 2: Neon PostgreSQL에서 사용자 조회
    console.log("\n[Step 2] Neon PostgreSQL 연결 중...");
    await prisma.$connect();
    console.log("✅ Neon 연결 성공");

    console.log("\n[Step 3] Neon에서 사용자 조회 중...");
    const neonUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        grade: true,
        studentCode: true,
        studentId: true,
        parentPhone: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        approved: true,
        academyId: true,
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Neon 사용자: ${neonUsers.length}명`);
    
    // 역할별 통계
    const neonStats = {
      SUPER_ADMIN: neonUsers.filter(u => u.role === "SUPER_ADMIN").length,
      DIRECTOR: neonUsers.filter(u => u.role === "DIRECTOR").length,
      TEACHER: neonUsers.filter(u => u.role === "TEACHER").length,
      STUDENT: neonUsers.filter(u => u.role === "STUDENT").length,
    };
    console.log("📊 Neon 역할별 통계:", neonStats);

    // Step 3: Cloudflare D1에서 사용자 조회 시도
    console.log("\n[Step 4] Cloudflare D1 연결 시도...");
    let d1Users: any[] = [];
    let d1Error = null;

    try {
      // D1 환경 변수 확인
      const hasD1Config = !!(
        process.env.CLOUDFLARE_ACCOUNT_ID &&
        process.env.CLOUDFLARE_D1_DATABASE_ID &&
        (process.env.CLOUDFLARE_D1_API_TOKEN || 
         (process.env.CLOUDFLARE_API_KEY && process.env.CLOUDFLARE_EMAIL))
      );

      if (hasD1Config) {
        console.log("✅ D1 환경 변수 확인됨");
        
        // D1에서 사용자 조회
        const { getD1Users } = await import("@/lib/cloudflare-d1-client");
        d1Users = await getD1Users();
        
        console.log(`✅ D1 사용자: ${d1Users.length}명`);
        
        // D1 역할별 통계
        const d1Stats = {
          SUPER_ADMIN: d1Users.filter(u => u.role === "SUPER_ADMIN").length,
          DIRECTOR: d1Users.filter(u => u.role === "DIRECTOR").length,
          TEACHER: d1Users.filter(u => u.role === "TEACHER").length,
          STUDENT: d1Users.filter(u => u.role === "STUDENT").length,
        };
        console.log("📊 D1 역할별 통계:", d1Stats);
      } else {
        console.log("⚠️ D1 환경 변수 없음 (건너뜀)");
        console.log("   필요한 변수:", {
          CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID,
          CLOUDFLARE_D1_DATABASE_ID: !!process.env.CLOUDFLARE_D1_DATABASE_ID,
          CLOUDFLARE_D1_API_TOKEN: !!process.env.CLOUDFLARE_D1_API_TOKEN,
          CLOUDFLARE_API_KEY: !!process.env.CLOUDFLARE_API_KEY,
          CLOUDFLARE_EMAIL: !!process.env.CLOUDFLARE_EMAIL,
        });
      }
    } catch (error: any) {
      console.error("❌ D1 조회 실패:", error.message);
      d1Error = error.message;
    }

    // Step 4: Neon과 D1 사용자 병합 (중복 제거)
    console.log("\n[Step 5] 사용자 병합 중...");
    
    // 이메일 기준으로 중복 제거 (Neon 우선)
    const neonEmailSet = new Set(neonUsers.map(u => u.email));
    const uniqueD1Users = d1Users.filter(u => !neonEmailSet.has(u.email));
    
    // D1 사용자를 Neon 형식으로 변환
    const normalizedD1Users = uniqueD1Users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      grade: u.grade,
      studentCode: u.studentCode,
      studentId: u.studentId,
      parentPhone: u.parentPhone,
      points: u.points || 0,
      aiChatEnabled: u.aiChatEnabled || false,
      aiHomeworkEnabled: u.aiHomeworkEnabled || false,
      aiStudyEnabled: u.aiStudyEnabled || false,
      approved: u.approved || false,
      academyId: u.academyId,
      academy: u.academyId ? {
        id: u.academyId,
        name: "Unknown Academy",
        code: "",
      } : null,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
      updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
    }));

    // 전체 사용자 목록
    const allUsers = [...neonUsers, ...normalizedD1Users];
    
    console.log(`✅ 병합 완료: 총 ${allUsers.length}명`);
    console.log(`   - Neon: ${neonUsers.length}명`);
    console.log(`   - D1 (고유): ${normalizedD1Users.length}명`);

    // Step 5: 응답 생성
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("\n" + "=".repeat(80));
    console.log(`✅ 성공! (처리 시간: ${duration}ms)`);
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      users: allUsers,
      meta: {
        total: allUsers.length,
        sources: {
          neon: neonUsers.length,
          d1: normalizedD1Users.length,
        },
        stats: {
          SUPER_ADMIN: allUsers.filter(u => u.role === "SUPER_ADMIN").length,
          DIRECTOR: allUsers.filter(u => u.role === "DIRECTOR").length,
          TEACHER: allUsers.filter(u => u.role === "TEACHER").length,
          STUDENT: allUsers.filter(u => u.role === "STUDENT").length,
        },
        d1Error: d1Error,
        processingTime: duration,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error("\n" + "=".repeat(80));
    console.error("❌ 오류 발생!");
    console.error("=".repeat(80));
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error("=".repeat(80) + "\n");

    return NextResponse.json(
      {
        success: false,
        error: "사용자 목록을 가져오는데 실패했습니다.",
        details: {
          message: error.message,
          type: error.constructor.name,
          stack: error.stack,
          processingTime: duration,
        },
      },
      { status: 500 }
    );
  }
}
