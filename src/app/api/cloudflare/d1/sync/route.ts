import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { executeD1Query, isD1Configured } from '@/lib/cloudflare-d1-client';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SyncResult {
  fromD1ToLocal: {
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  };
  fromLocalToD1: {
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  };
}

/**
 * POST /api/cloudflare/d1/sync
 * 
 * Cloudflare D1과 로컬 PostgreSQL 데이터베이스 간 양방향 동기화
 * 
 * Query Parameters:
 * - direction: 'from-d1' | 'to-d1' | 'bidirectional' (default: 'bidirectional')
 * - role: 'STUDENT' | 'DIRECTOR' | 'ALL' (default: 'ALL')
 * - academyId: string (optional, 특정 학원만 동기화)
 * 
 * Body:
 * {
 *   "dryRun": boolean (default: false, true면 실제 변경 없이 시뮬레이션만)
 * }
 */
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
        { error: '권한이 없습니다. SUPER_ADMIN만 동기화를 실행할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const direction = (searchParams.get('direction') || 'bidirectional') as 'from-d1' | 'to-d1' | 'bidirectional';
    const roleFilter = searchParams.get('role') || 'ALL';
    const academyId = searchParams.get('academyId');

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    console.log(`🔄 동기화 시작: ${direction}, 역할: ${roleFilter}, Dry Run: ${dryRun}`);

    // D1 연결 확인
    if (!isD1Configured()) {
      return NextResponse.json(
        { error: 'Cloudflare D1이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const result: SyncResult = {
      fromD1ToLocal: { created: 0, updated: 0, failed: 0, errors: [] },
      fromLocalToD1: { created: 0, updated: 0, failed: 0, errors: [] },
    };

    // ============================================
    // 1. D1 → Local PostgreSQL 동기화
    // ============================================
    if (direction === 'from-d1' || direction === 'bidirectional') {
      console.log('📥 D1 → Local 동기화 시작...');

      // D1에서 사용자 가져오기
      let d1Sql = `SELECT * FROM User WHERE 1=1`;
      const d1Params: any[] = [];

      if (roleFilter !== 'ALL') {
        d1Sql += ` AND role = ?`;
        d1Params.push(roleFilter);
      }

      if (academyId) {
        d1Sql += ` AND academyId = ?`;
        d1Params.push(academyId);
      }

      const d1Users = await executeD1Query(d1Sql, d1Params);
      console.log(`  📊 D1에서 ${d1Users.length}명의 사용자를 가져왔습니다.`);

      // 각 D1 사용자를 로컬 DB에 동기화
      for (const d1User of d1Users) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: d1User.email },
          });

          if (existingUser) {
            // 기존 사용자 업데이트
            if (!dryRun) {
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
            }
            result.fromD1ToLocal.updated++;
            console.log(`  ✓ 업데이트: ${d1User.email}`);
          } else {
            // 새 사용자 생성
            if (!dryRun) {
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
            }
            result.fromD1ToLocal.created++;
            console.log(`  ✓ 생성: ${d1User.email}`);
          }
        } catch (error: any) {
          result.fromD1ToLocal.failed++;
          result.fromD1ToLocal.errors.push({
            email: d1User.email,
            error: error.message,
          });
          console.error(`  ✗ 실패: ${d1User.email}`, error.message);
        }
      }
    }

    // ============================================
    // 2. Local PostgreSQL → D1 동기화
    // ============================================
    if (direction === 'to-d1' || direction === 'bidirectional') {
      console.log('📤 Local → D1 동기화 시작...');

      // 로컬 DB에서 사용자 가져오기
      const whereClause: any = {};
      if (roleFilter !== 'ALL') {
        whereClause.role = roleFilter;
      }
      if (academyId) {
        whereClause.academyId = academyId;
      }

      const localUsers = await prisma.user.findMany({
        where: whereClause,
      });
      console.log(`  📊 Local DB에서 ${localUsers.length}명의 사용자를 가져왔습니다.`);

      // 각 로컬 사용자를 D1에 동기화
      for (const localUser of localUsers) {
        try {
          // D1에서 기존 사용자 확인
          const d1User = await workerDB.queryFirst(
            `SELECT id FROM User WHERE email = ?`,
            [localUser.email]
          );

          if (d1User) {
            // 기존 사용자 업데이트
            if (!dryRun) {
              await workerDB.write(
                `UPDATE User SET 
                  name = ?,
                  phone = ?,
                  grade = ?,
                  parentPhone = ?,
                  studentCode = ?,
                  studentId = ?,
                  academyId = ?,
                  approved = ?,
                  aiChatEnabled = ?,
                  aiHomeworkEnabled = ?,
                  aiStudyEnabled = ?,
                  points = ?,
                  updatedAt = datetime('now')
                WHERE email = ?`,
                [
                  localUser.name,
                  localUser.phone,
                  localUser.grade,
                  localUser.parentPhone,
                  localUser.studentCode,
                  localUser.studentId,
                  localUser.academyId,
                  localUser.approved ? 1 : 0,
                  localUser.aiChatEnabled ? 1 : 0,
                  localUser.aiHomeworkEnabled ? 1 : 0,
                  localUser.aiStudyEnabled ? 1 : 0,
                  localUser.points || 0,
                  localUser.email,
                ]
              );
            }
            result.fromLocalToD1.updated++;
            console.log(`  ✓ 업데이트: ${localUser.email}`);
          } else {
            // 새 사용자 생성
            if (!dryRun) {
              const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await workerDB.write(
                `INSERT INTO User (
                  id, email, password, name, role, phone, grade, parentPhone,
                  studentCode, studentId, academyId, approved, aiChatEnabled,
                  aiHomeworkEnabled, aiStudyEnabled, points, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  newUserId,
                  localUser.email,
                  localUser.password,
                  localUser.name,
                  localUser.role,
                  localUser.phone,
                  localUser.grade,
                  localUser.parentPhone,
                  localUser.studentCode,
                  localUser.studentId,
                  localUser.academyId,
                  localUser.approved ? 1 : 0,
                  localUser.aiChatEnabled ? 1 : 0,
                  localUser.aiHomeworkEnabled ? 1 : 0,
                  localUser.aiStudyEnabled ? 1 : 0,
                  localUser.points || 0,
                ]
              );
            }
            result.fromLocalToD1.created++;
            console.log(`  ✓ 생성: ${localUser.email}`);
          }
        } catch (error: any) {
          result.fromLocalToD1.failed++;
          result.fromLocalToD1.errors.push({
            email: localUser.email,
            error: error.message,
          });
          console.error(`  ✗ 실패: ${localUser.email}`, error.message);
        }
      }
    }

    // 활동 로그 기록
    if (!dryRun) {
      try {
        await prisma.activityLog.create({
          data: {
            userId: (session.user as any)?.id || null,
            sessionId: `d1-sync-${Date.now()}`,
            action: 'CLOUDFLARE_D1_SYNC',
            description: `Cloudflare D1 동기화 완료 (${direction}) - D1→Local: 생성 ${result.fromD1ToLocal.created}, 업데이트 ${result.fromD1ToLocal.updated} | Local→D1: 생성 ${result.fromLocalToD1.created}, 업데이트 ${result.fromLocalToD1.updated}`,
          },
        });
      } catch (logError) {
        console.error('활동 로그 기록 실패:', logError);
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? '동기화 시뮬레이션 완료 (실제 변경 없음)' : '동기화 완료',
      dryRun,
      direction,
      roleFilter,
      academyId,
      result,
    });
  } catch (error: any) {
    console.error('Cloudflare D1 동기화 오류:', error);

    // Cloudflare Worker 연결 오류 처리
    if (error.message.includes('CLOUDFLARE_WORKER_URL') || error.message.includes('CLOUDFLARE_WORKER_TOKEN')) {
      return NextResponse.json(
        { 
          error: 'Cloudflare Worker 연결 설정이 필요합니다.',
          details: 'CLOUDFLARE_WORKER_URL과 CLOUDFLARE_WORKER_TOKEN을 Vercel 환경 변수에 설정하세요.',
          envVarsNeeded: {
            CLOUDFLARE_WORKER_URL: 'https://your-worker.your-subdomain.workers.dev',
            CLOUDFLARE_WORKER_TOKEN: 'your-secret-api-token',
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: '동기화 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/cloudflare/d1/sync
 * 
 * 동기화 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Cloudflare D1 연결 테스트
    let workerStatus: 'connected' | 'disconnected' = 'disconnected';
    let workerError = '';
    
    try {
      // D1 설정 확인
      if (!isD1Configured()) {
        throw new Error('Cloudflare D1 환경 변수가 설정되지 않았습니다.');
      }
      
      // D1 연결 테스트
      await executeD1Query('SELECT 1 as test');
      workerStatus = 'connected';
      console.log('✅ Cloudflare D1 연결 성공');
    } catch (error: any) {
      workerError = error.message;
      console.error('❌ Cloudflare D1 연결 실패:', error);
    }

    // 최근 동기화 로그
    const recentSyncs = await prisma.activityLog.findMany({
      where: {
        action: 'CLOUDFLARE_D1_SYNC',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
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
    });

    // 로컬 DB 통계
    const localStats = {
      totalUsers: await prisma.user.count(),
      students: await prisma.user.count({ where: { role: 'STUDENT' } }),
      directors: await prisma.user.count({ where: { role: 'DIRECTOR' } }),
      teachers: await prisma.user.count({ where: { role: 'TEACHER' } }),
    };

    // D1 통계 (연결된 경우만)
    let d1Stats = null;
    if (workerStatus === 'connected') {
      try {
        const d1Users = await executeD1Query(`SELECT role, COUNT(*) as count FROM User GROUP BY role`);
        d1Stats = {
          totalUsers: d1Users.reduce((sum: number, row: any) => sum + (row.count || 0), 0),
          students: d1Users.find((r: any) => r.role === 'STUDENT')?.count || 0,
          directors: d1Users.find((r: any) => r.role === 'DIRECTOR')?.count || 0,
          teachers: d1Users.find((r: any) => r.role === 'TEACHER')?.count || 0,
        };
        console.log('✅ D1 통계:', d1Stats);
      } catch (error) {
        console.error('❌ D1 통계 조회 실패:', error);
      }
    }

    return NextResponse.json({
      success: true,
      workerStatus,
      workerError,
      localStats,
      d1Stats,
      recentSyncs: recentSyncs.map(log => ({
        id: log.id,
        action: log.action,
        description: log.description,
        createdAt: log.createdAt,
        user: log.user ? {
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
        } : null,
      })),
    });
  } catch (error: any) {
    console.error('동기화 상태 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '동기화 상태를 가져오는 데 실패했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
