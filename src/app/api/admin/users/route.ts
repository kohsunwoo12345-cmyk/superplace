import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAllUsers } from "@/lib/admin-sync";

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

    // sync=true 파라미터가 있으면 Cloudflare와 동기화 먼저 수행
    if (sync === 'true') {
      try {
        console.log('🔄 Cloudflare 사용자 동기화 시작...');
        const syncReport = await syncAllUsers();
        console.log('✅ Cloudflare 사용자 동기화 완료:', syncReport);
        
        // 동기화 이력 저장
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'SYNC_ALL_USERS',
            resource: 'USER',
            description: `전체 사용자 동기화 완료 (생성: ${syncReport.created}, 업데이트: ${syncReport.updated}, 실패: ${syncReport.failed})`,
            metadata: {
              ...syncReport,
              syncedAt: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error('⚠️ Cloudflare 동기화 실패 (계속 진행):', error);
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
    });
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "사용자 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
