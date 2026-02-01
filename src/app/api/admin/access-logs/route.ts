import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 접속 로그 조회 (관리자 전용)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userType = searchParams.get('userType'); // 'member', 'guest', 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');

    const skip = (page - 1) * limit;

    // 필터 조건 구성
    const where: any = {};

    if (userType === 'member') {
      where.userId = { not: null };
    } else if (userType === 'guest') {
      where.userId = null;
    }

    if (startDate || endDate) {
      where.accessedAt = {};
      if (startDate) {
        where.accessedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // 종료일의 23:59:59까지 포함
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.accessedAt.lte = end;
      }
    }

    if (action) {
      where.activityType = action;
    }

    // 접속 로그 조회
    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          accessedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.accessLog.count({ where }),
    ]);

    // 통계 데이터
    const stats = await prisma.accessLog.groupBy({
      by: ['activityType'],
      where,
      _count: {
        id: true,
      },
    });

    const memberCount = await prisma.accessLog.count({
      where: {
        ...where,
        userId: { not: null },
      },
    });

    const guestCount = await prisma.accessLog.count({
      where: {
        ...where,
        userId: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          ...log,
          // 한국 시간으로 변환
          accessedAt: log.accessedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total,
          memberCount,
          guestCount,
          byActivity: stats.reduce((acc, stat) => {
            acc[stat.activityType || 'unknown'] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  } catch (error) {
    console.error('접속 로그 조회 오류:', error);
    return NextResponse.json(
      { error: '접속 로그 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 접속 로그 기록
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      sessionId,
      path,
      method,
      activityType,
      activityData,
    } = body;

    // IP 및 User Agent 추출
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // User Agent 파싱 (간단한 버전)
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                    userAgent.includes('Firefox') ? 'Firefox' :
                    userAgent.includes('Safari') ? 'Safari' :
                    userAgent.includes('Edge') ? 'Edge' : 'Other';

    const os = userAgent.includes('Windows') ? 'Windows' :
               userAgent.includes('Mac') ? 'macOS' :
               userAgent.includes('Linux') ? 'Linux' :
               userAgent.includes('Android') ? 'Android' :
               userAgent.includes('iOS') ? 'iOS' : 'Other';

    const device = userAgent.includes('Mobile') ? 'mobile' :
                   userAgent.includes('Tablet') ? 'tablet' : 'desktop';

    const log = await prisma.accessLog.create({
      data: {
        userId: userId || null,
        sessionId: sessionId || `guest-${Date.now()}`,
        ipAddress,
        userAgent,
        browser,
        os,
        device,
        path: path || '/',
        method: method || 'GET',
        activityType: activityType || 'page_view',
        activityData: activityData || {},
      },
    });

    return NextResponse.json({
      success: true,
      logId: log.id,
    });
  } catch (error) {
    console.error('접속 로그 기록 오류:', error);
    return NextResponse.json(
      { error: '접속 로그 기록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
