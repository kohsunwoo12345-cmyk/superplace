import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/test-db
 * 데이터베이스 연결 및 사용자 조회 테스트
 */
export async function GET() {
  try {
    console.log('🔍 데이터베이스 테스트 시작...');

    // 1. 인증 테스트
    let sessionInfo = 'No session';
    try {
      const session = await getServerSession(authOptions);
      sessionInfo = session ? `User: ${session.user?.email}, Role: ${session.user?.role}` : 'Not authenticated';
    } catch (error: any) {
      sessionInfo = `Session error: ${error.message}`;
    }

    // 2. DB 연결 테스트
    let dbTest = 'Failed';
    try {
      await prisma.$connect();
      dbTest = 'Connected';
    } catch (error: any) {
      dbTest = `Connection error: ${error.message}`;
    }

    // 3. 사용자 수 조회
    let userCount = 0;
    let countError = null;
    try {
      userCount = await prisma.user.count();
    } catch (error: any) {
      countError = error.message;
    }

    // 4. 간단한 사용자 조회
    let users = [];
    let queryError = null;
    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
        take: 5,
      });
    } catch (error: any) {
      queryError = error.message;
    }

    return NextResponse.json({
      success: true,
      session: sessionInfo,
      database: {
        connection: dbTest,
        userCount,
        countError,
        queryError,
        sampleUsers: users,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ 테스트 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.name,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
