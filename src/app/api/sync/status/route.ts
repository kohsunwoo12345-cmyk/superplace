import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkExternalDBConnection, isExternalDBEnabled } from '@/lib/external-db';
import { fetchStudentsFromExternal, fetchTeachersFromExternal } from '@/lib/sync-utils';

/**
 * 동기화 상태 확인 API
 * GET /api/sync/status
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

    // 외부 DB 활성화 여부
    const isEnabled = isExternalDBEnabled();
    
    // 외부 DB 연결 상태
    let isConnected = false;
    if (isEnabled) {
      isConnected = await checkExternalDBConnection();
    }

    // 통계 정보
    let stats = null;
    if (isConnected && session.user.academyId) {
      try {
        const externalStudents = await fetchStudentsFromExternal(session.user.academyId);
        const externalTeachers = await fetchTeachersFromExternal(session.user.academyId);

        stats = {
          externalStudentCount: externalStudents.length,
          externalTeacherCount: externalTeachers.length,
          lastChecked: new Date(),
        };
      } catch (error) {
        console.error('통계 조회 실패:', error);
      }
    }

    return NextResponse.json({
      success: true,
      sync: {
        enabled: isEnabled,
        connected: isConnected,
        externalDB: process.env.EXTERNAL_DATABASE_URL ? '설정됨' : '미설정',
      },
      stats,
      message: isEnabled
        ? (isConnected ? '외부 DB와 연결되어 실시간 동기화가 활성화되었습니다.' : '외부 DB 연결 실패')
        : '외부 DB가 설정되지 않았습니다.',
    });
  } catch (error) {
    console.error('동기화 상태 확인 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '동기화 상태 확인 중 오류가 발생했습니다',
        sync: {
          enabled: false,
          connected: false,
        },
      },
      { status: 500 }
    );
  }
}
