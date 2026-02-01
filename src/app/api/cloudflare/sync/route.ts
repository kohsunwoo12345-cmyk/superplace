import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * POST /api/cloudflare/sync
 * 
 * Cloudflare 웹사이트의 사용자 데이터를 수동으로 동기화
 * 
 * 요청 형식:
 * {
 *   "users": [
 *     {
 *       "email": "student@example.com",
 *       "password": "plaintext_password", // 평문 비밀번호 (해시되어 저장됨)
 *       "name": "홍길동",
 *       "role": "STUDENT",
 *       "phone": "010-1234-5678",
 *       "grade": "3학년",
 *       "parentPhone": "010-9876-5432",
 *       "academyId": "academy_id"
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { users, apiKey } = body;

    // API 키 검증 (보안)
    if (apiKey !== process.env.CLOUDFLARE_SYNC_API_KEY) {
      return NextResponse.json(
        { error: '유효하지 않은 API 키입니다.' },
        { status: 403 }
      );
    }

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: '사용자 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const results = {
      created: [] as string[],
      updated: [] as string[],
      failed: [] as { email: string; error: string }[],
    };

    for (const userData of users) {
      try {
        const { email, password, name, role, phone, grade, parentPhone, academyId } = userData;

        if (!email || !password || !name) {
          results.failed.push({
            email: email || 'unknown',
            error: '필수 필드 누락 (email, password, name)',
          });
          continue;
        }

        // 기존 사용자 확인
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // 기존 사용자 업데이트 (비밀번호는 변경하지 않음)
          await prisma.user.update({
            where: { email },
            data: {
              name,
              phone: phone || existingUser.phone,
              grade: grade || existingUser.grade,
              parentPhone: parentPhone || existingUser.parentPhone,
              updatedAt: new Date(),
            },
          });
          results.updated.push(email);
          console.log(`✓ 업데이트: ${email}`);
        } else {
          // 비밀번호 해시
          const hashedPassword = await bcrypt.hash(password, 10);

          // 새 사용자 생성
          await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name,
              role: role || 'STUDENT',
              phone,
              grade,
              parentPhone,
              academyId: academyId || null,
              approved: true, // Cloudflare에서 온 사용자는 자동 승인
              emailVerified: new Date(), // 이메일 인증 완료로 간주
            },
          });
          results.created.push(email);
          console.log(`✓ 생성: ${email}`);
        }
      } catch (error: any) {
        results.failed.push({
          email: userData.email || 'unknown',
          error: error.message || '알 수 없는 오류',
        });
        console.error(`✗ 실패: ${userData.email}`, error);
      }
    }

    // 활동 로그 기록 (sessionId는 임의 생성)
    try {
      await prisma.activityLog.create({
        data: {
          userId: null,
          sessionId: `cloudflare-sync-${Date.now()}`,
          action: 'CLOUDFLARE_SYNC',
          description: `Cloudflare 동기화 완료 - 생성: ${results.created.length}, 업데이트: ${results.updated.length}, 실패: ${results.failed.length}`,
        },
      });
    } catch (logError) {
      console.error('활동 로그 기록 실패:', logError);
      // 로그 실패는 무시하고 계속 진행
    }

    return NextResponse.json({
      success: true,
      message: `동기화 완료: 생성 ${results.created.length}명, 업데이트 ${results.updated.length}명, 실패 ${results.failed.length}명`,
      results,
    });
  } catch (error: any) {
    console.error('Cloudflare 동기화 오류:', error);
    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/cloudflare/sync
 * 
 * 동기화 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    // 최근 동기화 로그 조회
    const recentSyncs = await prisma.activityLog.findMany({
      where: {
        action: 'CLOUDFLARE_SYNC',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // 전체 사용자 수
    const totalUsers = await prisma.user.count();
    
    // 역할별 사용자 수
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        usersByRole,
      },
      recentSyncs,
    });
  } catch (error: any) {
    console.error('동기화 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '상태 조회 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
