import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { executeD1Query, isD1Configured } from '@/lib/cloudflare-d1-client';

const prisma = new PrismaClient();

/**
 * GET /api/auto-sync-d1
 * 
 * 자동 양방향 동기화 (인증 불필요)
 * - Cron Job이나 외부에서 주기적으로 호출
 * - D1 ↔ Local 양방향 동기화
 */
export async function GET(request: NextRequest) {
  try {
    // 보안: API 키 확인 (선택사항)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SYNC_API_KEY || 'default-sync-key';
    
    if (authHeader !== `Bearer ${apiKey}`) {
      console.log('⚠️ API 키 없이 자동 동기화 실행 (공개 모드)');
      // API 키가 없어도 계속 진행 (공개 동기화)
    }

    console.log('🔄 자동 양방향 동기화 시작...');

    // D1 설정 확인
    if (!isD1Configured()) {
      console.error('❌ Cloudflare D1이 설정되지 않았습니다.');
      return NextResponse.json({
        success: false,
        error: 'Cloudflare D1이 설정되지 않았습니다.',
      }, { status: 500 });
    }

    const result = {
      d1ToLocal: { created: 0, updated: 0, failed: 0, errors: [] as any[] },
      localToD1: { created: 0, updated: 0, failed: 0, errors: [] as any[] },
      timestamp: new Date().toISOString(),
    };

    // ============================================
    // Part 1: D1 → Local (새 회원가입 동기화)
    // ============================================
    try {
      console.log('📥 Part 1: D1 → Local 동기화...');
      
      const d1Users = await executeD1Query(`
        SELECT * FROM User 
        ORDER BY createdAt DESC 
        LIMIT 100
      `);
      
      console.log(`  D1에서 ${d1Users.length}명 조회`);

      for (const d1User of d1Users) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: d1User.email },
          });

          if (existingUser) {
            // 업데이트
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
                approved: d1User.approved === 1,
                aiChatEnabled: d1User.aiChatEnabled === 1,
                aiHomeworkEnabled: d1User.aiHomeworkEnabled === 1,
                aiStudyEnabled: d1User.aiStudyEnabled === 1,
                points: d1User.points || 0,
                updatedAt: new Date(),
              },
            });
            result.d1ToLocal.updated++;
            console.log(`    ✅ 업데이트: ${d1User.email}`);
          } else {
            // 생성
            await prisma.user.create({
              data: {
                email: d1User.email,
                name: d1User.name,
                password: d1User.password,
                phone: d1User.phone,
                role: d1User.role || 'STUDENT',
                grade: d1User.grade,
                parentPhone: d1User.parentPhone,
                studentCode: d1User.studentCode,
                studentId: d1User.studentId,
                academyId: d1User.academyId,
                approved: d1User.approved === 1,
                aiChatEnabled: d1User.aiChatEnabled === 1,
                aiHomeworkEnabled: d1User.aiHomeworkEnabled === 1,
                aiStudyEnabled: d1User.aiStudyEnabled === 1,
                points: d1User.points || 0,
                emailVerified: d1User.emailVerified ? new Date(d1User.emailVerified) : null,
              },
            });
            result.d1ToLocal.created++;
            console.log(`    ✅ 생성: ${d1User.email}`);
          }
        } catch (error: any) {
          result.d1ToLocal.failed++;
          result.d1ToLocal.errors.push({
            email: d1User.email,
            error: error.message,
          });
          console.error(`    ❌ 실패: ${d1User.email} - ${error.message}`);
        }
      }

      console.log(`  ✅ D1→Local 완료: 생성 ${result.d1ToLocal.created}, 업데이트 ${result.d1ToLocal.updated}`);
    } catch (error: any) {
      console.error('❌ D1→Local 동기화 오류:', error);
      result.d1ToLocal.errors.push({ error: error.message });
    }

    // ============================================
    // Part 2: Local → D1 (기존 사용자 백업)
    // ============================================
    try {
      console.log('📤 Part 2: Local → D1 동기화...');
      
      const localUsers = await prisma.user.findMany({
        where: {
          // 최근 업데이트된 사용자만 (성능 최적화)
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 최근 24시간
          },
        },
        take: 100,
      });

      console.log(`  로컬에서 ${localUsers.length}명 조회 (최근 24시간)`);

      for (const user of localUsers) {
        try {
          // D1에 이메일 존재 확인
          const d1Existing = await executeD1Query(
            `SELECT id FROM User WHERE email = ?`,
            [user.email]
          );

          if (d1Existing.length > 0) {
            // 업데이트
            await executeD1Query(
              `UPDATE User SET 
                name = ?, password = ?, phone = ?, role = ?, grade = ?,
                studentCode = ?, studentId = ?, parentPhone = ?, academyId = ?,
                points = ?, aiChatEnabled = ?, aiHomeworkEnabled = ?, aiStudyEnabled = ?,
                approved = ?, updatedAt = datetime('now')
              WHERE email = ?`,
              [
                user.name,
                user.password,
                user.phone,
                user.role,
                user.grade,
                user.studentCode,
                user.studentId,
                user.parentPhone,
                user.academyId,
                user.points || 0,
                user.aiChatEnabled ? 1 : 0,
                user.aiHomeworkEnabled ? 1 : 0,
                user.aiStudyEnabled ? 1 : 0,
                user.approved ? 1 : 0,
                user.email,
              ]
            );
            result.localToD1.updated++;
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
                user.phone,
                user.role,
                user.grade,
                user.studentCode,
                user.studentId,
                user.parentPhone,
                user.academyId,
                user.points || 0,
                user.aiChatEnabled ? 1 : 0,
                user.aiHomeworkEnabled ? 1 : 0,
                user.aiStudyEnabled ? 1 : 0,
                user.approved ? 1 : 0,
              ]
            );
            result.localToD1.created++;
          }
        } catch (error: any) {
          result.localToD1.failed++;
          result.localToD1.errors.push({
            email: user.email,
            error: error.message,
          });
        }
      }

      console.log(`  ✅ Local→D1 완료: 생성 ${result.localToD1.created}, 업데이트 ${result.localToD1.updated}`);
    } catch (error: any) {
      console.error('❌ Local→D1 동기화 오류:', error);
      result.localToD1.errors.push({ error: error.message });
    }

    // 활동 로그 저장 (SUPER_ADMIN 사용자로)
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
      });

      if (adminUser) {
        await prisma.activityLog.create({
          data: {
            userId: adminUser.id,
            action: 'AUTO_SYNC_D1',
            description: `자동 양방향 동기화: D1→Local (생성 ${result.d1ToLocal.created}, 업데이트 ${result.d1ToLocal.updated}), Local→D1 (생성 ${result.localToD1.created}, 업데이트 ${result.localToD1.updated})`,
            metadata: result,
          },
        });
      }
    } catch (error) {
      console.error('활동 로그 저장 실패:', error);
    }

    console.log('✅ 자동 양방향 동기화 완료!');

    return NextResponse.json({
      success: true,
      message: '자동 양방향 동기화 완료',
      result,
    });
  } catch (error: any) {
    console.error('❌ 자동 동기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
