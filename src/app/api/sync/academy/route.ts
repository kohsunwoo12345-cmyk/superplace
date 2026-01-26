import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncAcademyData, syncAllAcademies } from '@/lib/user-sync';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sync/academy
 * 특정 학원의 데이터를 Cloudflare와 동기화
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { academyId, syncAll } = body;

    // 전체 학원 동기화 (SUPER_ADMIN만 가능)
    if (syncAll) {
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: '전체 동기화는 관리자만 가능합니다' },
          { status: 403 }
        );
      }

      console.log(`\n🌐 전체 학원 동기화 요청 (사용자: ${session.user.name})`);
      
      const reports = await syncAllAcademies();

      // 동기화 로그 저장
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          sessionId: `sync-all-${Date.now()}`,
          action: 'SYNC_ALL_ACADEMIES',
          description: `전체 학원 동기화 완료 (${reports.length}개 학원)`,
          metadata: JSON.stringify({
            reports: reports.map(r => ({
              academyId: r.academyId,
              academyName: r.academyName,
              students: r.students,
              classes: r.classes,
              errors: r.errors.length,
            })),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `전체 학원 동기화 완료 (${reports.length}개 학원)`,
        reports,
      });
    }

    // 특정 학원 동기화
    if (!academyId) {
      return NextResponse.json(
        { error: '학원 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 권한 확인
    if (session.user.role === 'DIRECTOR' && session.user.academyId !== academyId) {
      return NextResponse.json(
        { error: '자신의 학원만 동기화할 수 있습니다' },
        { status: 403 }
      );
    }

    if (session.user.role === 'TEACHER') {
      return NextResponse.json(
        { error: '선생님은 동기화 권한이 없습니다' },
        { status: 403 }
      );
    }

    console.log(`\n🔄 학원 동기화 요청 (학원: ${academyId}, 사용자: ${session.user.name})`);

    const report = await syncAcademyData(academyId, session.user.id);

    // 동기화 로그 저장
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        sessionId: `sync-academy-${Date.now()}`,
        action: 'SYNC_ACADEMY',
        description: `학원 동기화 완료 (${report.academyName})`,
        metadata: JSON.stringify({
          academyId: report.academyId,
          academyName: report.academyName,
          students: report.students,
          classes: report.classes,
          errors: report.errors.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `학원 동기화 완료 (${report.academyName})`,
      report,
    });
  } catch (error) {
    console.error('학원 동기화 API 오류:', error);
    return NextResponse.json(
      {
        error: '동기화 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/academy
 * 동기화 상태 및 히스토리 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const academyId = request.nextUrl.searchParams.get('academyId');

    // 권한 확인
    if (session.user.role === 'DIRECTOR' && (!academyId || session.user.academyId !== academyId)) {
      return NextResponse.json(
        { error: '자신의 학원만 조회할 수 있습니다' },
        { status: 403 }
      );
    }

    // 동기화 히스토리 조회
    const syncHistory = await prisma.activityLog.findMany({
      where: {
        action: {
          in: ['SYNC_ACADEMY', 'SYNC_ALL_ACADEMIES'],
        },
        ...(academyId && session.user.role !== 'SUPER_ADMIN' ? {
          userId: session.user.id,
        } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        action: true,
        description: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 학원별 통계
    let academyStats = null;
    if (academyId) {
      const academy = await prisma.academy.findUnique({
        where: { id: academyId },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              students: true,
              teachers: true,
              classes: true,
            },
          },
        },
      });

      academyStats = {
        academy: {
          id: academy?.id,
          name: academy?.name,
        },
        counts: {
          students: academy?._count.students || 0,
          teachers: academy?._count.teachers || 0,
          classes: academy?._count.classes || 0,
        },
      };
    }

    return NextResponse.json({
      success: true,
      syncHistory,
      academyStats,
    });
  } catch (error) {
    console.error('동기화 상태 조회 오류:', error);
    return NextResponse.json(
      {
        error: '조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
