import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

/**
 * POST /api/cloudflare/d1/auto-sync
 * 
 * 자동 동기화 시작/중지
 * 
 * Body:
 * {
 *   "action": "start" | "stop" | "status",
 *   "interval": 300000 (5분, 밀리초 단위)
 * }
 */

// 메모리에 자동 동기화 상태 저장 (프로덕션에서는 Redis 등 사용 권장)
let autoSyncInterval: NodeJS.Timeout | null = null;
let autoSyncStatus = {
  enabled: false,
  interval: 300000, // 5분
  lastSync: null as string | null,
  nextSync: null as string | null,
  totalSyncs: 0,
  errors: 0,
};

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (SUPER_ADMIN만 가능)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다. SUPER_ADMIN만 자동 동기화를 제어할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, interval } = body;

    switch (action) {
      case 'start':
        if (autoSyncInterval) {
          return NextResponse.json({
            success: false,
            message: '자동 동기화가 이미 실행 중입니다.',
            status: autoSyncStatus,
          });
        }

        // 간격 설정 (최소 1분, 기본 5분)
        const syncInterval = interval && interval >= 60000 ? interval : 300000;
        autoSyncStatus.interval = syncInterval;
        autoSyncStatus.enabled = true;

        // 자동 동기화 시작
        autoSyncInterval = setInterval(async () => {
          try {
            console.log('🔄 자동 동기화 실행 중...');
            
            const syncResponse = await fetch(
              `${process.env.NEXTAUTH_URL}/api/cloudflare/d1/sync?direction=bidirectional`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Internal-Request': 'true',
                  'X-Auto-Sync': 'true',
                },
                body: JSON.stringify({ dryRun: false }),
              }
            );

            if (syncResponse.ok) {
              autoSyncStatus.totalSyncs++;
              autoSyncStatus.lastSync = new Date().toISOString();
              autoSyncStatus.nextSync = new Date(Date.now() + syncInterval).toISOString();
              console.log('✅ 자동 동기화 완료');
            } else {
              autoSyncStatus.errors++;
              console.error('❌ 자동 동기화 실패:', syncResponse.status);
            }
          } catch (error) {
            autoSyncStatus.errors++;
            console.error('❌ 자동 동기화 오류:', error);
          }
        }, syncInterval);

        // 첫 번째 동기화는 즉시 실행
        autoSyncStatus.nextSync = new Date(Date.now() + syncInterval).toISOString();

        return NextResponse.json({
          success: true,
          message: `자동 동기화가 시작되었습니다. 간격: ${syncInterval / 1000}초`,
          status: autoSyncStatus,
        });

      case 'stop':
        if (!autoSyncInterval) {
          return NextResponse.json({
            success: false,
            message: '실행 중인 자동 동기화가 없습니다.',
            status: autoSyncStatus,
          });
        }

        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        autoSyncStatus.enabled = false;
        autoSyncStatus.nextSync = null;

        return NextResponse.json({
          success: true,
          message: '자동 동기화가 중지되었습니다.',
          status: autoSyncStatus,
        });

      case 'status':
        return NextResponse.json({
          success: true,
          status: autoSyncStatus,
        });

      default:
        return NextResponse.json(
          { error: '유효하지 않은 액션입니다. start, stop, status 중 하나를 선택하세요.' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('자동 동기화 제어 오류:', error);
    return NextResponse.json(
      { 
        error: '자동 동기화 제어 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cloudflare/d1/auto-sync
 * 
 * 자동 동기화 상태 확인
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    status: autoSyncStatus,
    timestamp: new Date().toISOString(),
  });
}
