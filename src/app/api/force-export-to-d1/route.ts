import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { executeD1Query, isD1Configured } from '@/lib/cloudflare-d1-client';

const prisma = new PrismaClient();

/**
 * POST /api/force-export-to-d1
 * 모든 로컬 사용자를 D1로 강제 내보내기 (인증 불필요)
 */
export async function POST() {
  try {
    console.log('📤 강제 내보내기 시작...');

    if (!isD1Configured()) {
      return NextResponse.json({
        success: false,
        error: 'Cloudflare D1이 설정되지 않았습니다.',
      }, { status: 500 });
    }

    // 모든 로컬 사용자 가져오기
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
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`📊 로컬에서 ${localUsers.length}명 조회`);

    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const user of localUsers) {
      try {
        // D1에 직접 INSERT (중복 무시)
        await executeD1Query(
          `INSERT OR REPLACE INTO User (
            id, email, name, password, phone, role, grade,
            studentCode, studentId, parentPhone, academyId,
            points, aiChatEnabled, aiHomeworkEnabled, aiStudyEnabled,
            approved, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            user.createdAt.toISOString(),
            user.updatedAt.toISOString(),
          ]
        );
        success++;
        console.log(`  ✅ ${user.email}`);
      } catch (error: any) {
        failed++;
        errors.push({ email: user.email, error: error.message });
        console.error(`  ❌ ${user.email}: ${error.message}`);
      }
    }

    console.log(`✅ 내보내기 완료: 성공 ${success}, 실패 ${failed}`);

    return NextResponse.json({
      success: true,
      message: `${success}명을 D1로 내보냈습니다.`,
      result: {
        total: localUsers.length,
        success,
        failed,
        errors,
      },
    });
  } catch (error: any) {
    console.error('❌ 강제 내보내기 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/force-export-to-d1
 * 미리보기
 */
export async function GET() {
  try {
    const localUserCount = await prisma.user.count();
    
    // D1 사용자 수
    let d1UserCount = 0;
    if (isD1Configured()) {
      try {
        const result = await executeD1Query(`SELECT COUNT(*) as count FROM User`);
        d1UserCount = result[0]?.count || 0;
      } catch (error) {
        console.error('D1 조회 실패:', error);
      }
    }

    return NextResponse.json({
      localUsers: localUserCount,
      d1Users: d1UserCount,
      willExport: localUserCount,
      message: `${localUserCount}명을 D1로 내보낼 준비가 되었습니다.`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
