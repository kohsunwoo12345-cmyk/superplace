import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getD1Users, isD1Configured } from "@/lib/cloudflare-d1-client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sync = searchParams.get('sync');

    // sync=true 파라미터가 있으면 Cloudflare D1과 동기화 먼저 수행
    let syncReport: any = null;
    if (sync === 'true') {
      // D1 설정 확인
      if (!isD1Configured()) {
        console.warn('⚠️ Cloudflare D1이 설정되지 않았습니다. 동기화를 건너뜁니다.');
        syncReport = { 
          error: 'Cloudflare D1 환경 변수가 설정되지 않았습니다.',
          failed: true,
          message: 'CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_KEY/CLOUDFLARE_EMAIL을 설정하세요.'
        };
      } else {
        try {
          console.log('🔄 Cloudflare D1 사용자 동기화 시작...');
          
          // Cloudflare D1에서 모든 사용자 가져오기
          const d1Users = await getD1Users();

          console.log(`📊 D1에서 ${d1Users.length}명의 사용자를 가져왔습니다.`);

          let created = 0;
          let updated = 0;
          let failed = 0;
          const errors: any[] = [];

          // 각 D1 사용자를 로컬 DB에 동기화
          for (const d1User of d1Users) {
            try {
              const existingUser = await prisma.user.findUnique({
                where: { email: d1User.email },
              });

              if (existingUser) {
                // 기존 사용자 업데이트
                await prisma.user.update({
                  where: { email: d1User.email },
                  data: {
                    name: d1User.name,
                    phone: d1User.phone,
                    grade: d1User.grade,
                    parentPhone: d1User.parentPhone,
                    studentCode: d1User.studentCode,
                    studentId: d1User.studentId,
                    academyId: d1User.academyId,
                    approved: !!d1User.approved,
                    aiChatEnabled: !!d1User.aiChatEnabled,
                    aiHomeworkEnabled: !!d1User.aiHomeworkEnabled,
                    aiStudyEnabled: !!d1User.aiStudyEnabled,
                    points: d1User.points || 0,
                    updatedAt: new Date(),
                  },
                });
                updated++;
                console.log(`  ✓ 업데이트: ${d1User.email}`);
              } else {
                // 새 사용자 생성
                await prisma.user.create({
                  data: {
                    email: d1User.email,
                    password: d1User.password, // 이미 해시된 비밀번호
                    name: d1User.name,
                    phone: d1User.phone,
                    role: d1User.role,
                    grade: d1User.grade,
                    parentPhone: d1User.parentPhone,
                    studentCode: d1User.studentCode,
                    studentId: d1User.studentId,
                    academyId: d1User.academyId,
                    approved: !!d1User.approved,
                    aiChatEnabled: !!d1User.aiChatEnabled,
                    aiHomeworkEnabled: !!d1User.aiHomeworkEnabled,
                    aiStudyEnabled: !!d1User.aiStudyEnabled,
                    points: d1User.points || 0,
                    emailVerified: d1User.emailVerified ? new Date(d1User.emailVerified) : null,
                  },
                });
                created++;
                console.log(`  ✓ 생성: ${d1User.email}`);
              }
            } catch (error: any) {
              failed++;
              errors.push({ email: d1User.email, error: error.message });
              console.error(`  ✗ 실패: ${d1User.email}`, error.message);
            }
          }

          syncReport = { created, updated, failed, total: d1Users.length, errors };
          console.log('✅ Cloudflare D1 사용자 동기화 완료:', syncReport);
          
          // 동기화 이력 저장
          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'SYNC_D1_USERS',
              resource: 'USER',
              description: `Cloudflare D1 사용자 동기화 완료 (총: ${syncReport.total}, 생성: ${syncReport.created}, 업데이트: ${syncReport.updated}, 실패: ${syncReport.failed})`,
              metadata: {
                ...syncReport,
                syncedAt: new Date().toISOString(),
              },
            },
          });
        } catch (error: any) {
          console.error('⚠️ Cloudflare D1 동기화 실패:', error);
          syncReport = { error: error.message, failed: true };
        }
      }
    }

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
        // 학생 부가정보
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

    return NextResponse.json({ 
      users,
      syncedFromCloudflare: sync === 'true',
      syncReport: syncReport || undefined,
    });
  } catch (error: any) {
    console.error("사용자 목록 조회 실패:", error);
    console.error("에러 상세:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: "사용자 목록 조회 중 오류가 발생했습니다.",
        details: error.message,
        errorType: error.name,
      },
      { status: 500 }
    );
  }
}
