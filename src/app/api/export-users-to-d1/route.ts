import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { executeD1Query, isD1Configured } from '@/lib/cloudflare-d1-client';

const prisma = new PrismaClient();

/**
 * POST /api/export-users-to-d1
 * 로컬 PostgreSQL의 모든 사용자를 Cloudflare D1로 내보내기
 */
export async function POST() {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'SUPER_ADMIN 권한이 필요합니다.' }, { status: 403 });
    }

    // D1 설정 확인
    if (!isD1Configured()) {
      return NextResponse.json({ 
        error: 'Cloudflare D1이 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    console.log('📤 로컬 DB → D1 사용자 내보내기 시작...');

    // 로컬 DB에서 모든 사용자 가져오기
    const localUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        phone: true,
        role: true,
        grade: true,
        studentCode: true,
        studentId: true,
        parentPhone: true,
        academyId: true,
        points: true,
        aiChatEnabled: true,
        aiHomeworkEnabled: true,
        aiStudyEnabled: true,
        approved: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`📊 로컬 DB에서 ${localUsers.length}명의 사용자를 가져왔습니다.`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const user of localUsers) {
      try {
        // D1에 해당 이메일이 있는지 확인
        const existingUsers = await executeD1Query(
          `SELECT id FROM User WHERE email = ?`,
          [user.email]
        );

        if (existingUsers.length > 0) {
          // 업데이트
          await executeD1Query(
            `UPDATE User SET 
              name = ?,
              password = ?,
              phone = ?,
              role = ?,
              grade = ?,
              studentCode = ?,
              studentId = ?,
              parentPhone = ?,
              academyId = ?,
              points = ?,
              aiChatEnabled = ?,
              aiHomeworkEnabled = ?,
              aiStudyEnabled = ?,
              approved = ?,
              updatedAt = datetime('now')
            WHERE email = ?`,
            [
              user.name,
              user.password,
              user.phone || null,
              user.role,
              user.grade || null,
              user.studentCode || null,
              user.studentId || null,
              user.parentPhone || null,
              user.academyId || null,
              user.points || 0,
              user.aiChatEnabled ? 1 : 0,
              user.aiHomeworkEnabled ? 1 : 0,
              user.aiStudyEnabled ? 1 : 0,
              user.approved ? 1 : 0,
              user.email,
            ]
          );
          updated++;
          console.log(`  ✅ 업데이트: ${user.email}`);
        } else {
          // 생성
          await executeD1Query(
            `INSERT INTO User (
              id, email, name, password, phone, role, grade,
              studentCode, studentId, parentPhone, academyId,
              points, aiChatEnabled, aiHomeworkEnabled, aiStudyEnabled,
              approved, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              user.id,
              user.email,
              user.name,
              user.password,
              user.phone || null,
              user.role,
              user.grade || null,
              user.studentCode || null,
              user.studentId || null,
              user.parentPhone || null,
              user.academyId || null,
              user.points || 0,
              user.aiChatEnabled ? 1 : 0,
              user.aiHomeworkEnabled ? 1 : 0,
              user.aiStudyEnabled ? 1 : 0,
              user.approved ? 1 : 0,
            ]
          );
          created++;
          console.log(`  ✅ 생성: ${user.email}`);
        }
      } catch (error: any) {
        failed++;
        const errorMessage = error.message || String(error);
        errors.push({ email: user.email, error: errorMessage });
        console.error(`  ❌ 실패: ${user.email} - ${errorMessage}`);
      }
    }

    console.log(`✅ 내보내기 완료: 생성 ${created}, 업데이트 ${updated}, 실패 ${failed}`);

    // 활동 로그 저장
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'EXPORT_USERS_TO_D1',
        description: `로컬 DB → D1 사용자 내보내기: 생성 ${created}, 업데이트 ${updated}, 실패 ${failed}`,
        metadata: {
          created,
          updated,
          skipped,
          failed,
          total: localUsers.length,
          errors,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: '사용자 내보내기 완료',
      result: {
        total: localUsers.length,
        created,
        updated,
        skipped,
        failed,
        errors,
      },
    });
  } catch (error: any) {
    console.error('❌ 사용자 내보내기 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/export-users-to-d1
 * 내보내기 미리보기 (실제 변경 없음)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 로컬 사용자 수
    const localUserCount = await prisma.user.count();
    const localUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    });

    // D1 사용자 수 (설정된 경우만)
    let d1UserCount = 0;
    if (isD1Configured()) {
      try {
        const d1Users = await executeD1Query(`SELECT COUNT(*) as count FROM User`);
        d1UserCount = d1Users[0]?.count || 0;
      } catch (error) {
        console.error('D1 조회 실패:', error);
      }
    }

    return NextResponse.json({
      localStats: {
        total: localUserCount,
        sampleUsers: localUsers,
      },
      d1Stats: {
        total: d1UserCount,
      },
      message: `${localUserCount}명의 사용자를 D1로 내보낼 수 있습니다.`,
    });
  } catch (error: any) {
    console.error('❌ 미리보기 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
