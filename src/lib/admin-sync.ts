/**
 * 관리자 전용 전체 사용자 동기화 시스템
 * Cloudflare D1 DB의 모든 사용자 데이터를 로컬 DB로 동기화
 */

import { prisma } from '@/lib/prisma';
import { 
  fetchCloudflareUsers,
  fetchCloudflareStudentsByAcademy,
  CloudflareUser
} from '@/lib/cloudflare-api';
import bcrypt from 'bcryptjs';

interface SyncResult {
  success: boolean;
  operation: string;
  entity: string;
  localId?: string;
  externalId?: string;
  error?: string;
  timestamp: Date;
}

interface UserSyncReport {
  totalUsers: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  results: SyncResult[];
}

/**
 * Cloudflare의 모든 사용자를 로컬 DB로 동기화
 */
export async function syncAllUsers(): Promise<UserSyncReport> {
  console.log('🔄 전체 사용자 동기화 시작...');
  
  const results: SyncResult[] = [];
  const errors: string[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  try {
    // 1. Cloudflare에서 모든 사용자 가져오기
    const cloudflareUsers = await fetchCloudflareUsers();
    console.log(`📥 Cloudflare 사용자: ${cloudflareUsers.length}명`);

    // 2. 로컬 DB에서 모든 사용자 가져오기 (이메일 기준)
    const localUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        grade: true,
        studentId: true,
        studentCode: true,
        parentPhone: true,
        academyId: true,
        approved: true,
        cloudflareUserId: true,
      },
    });

    const localUserMap = new Map(localUsers.map(u => [u.email, u]));

    // 3. Cloudflare → 로컬 동기화
    for (const cfUser of cloudflareUsers) {
      try {
        const localUser = localUserMap.get(cfUser.email);

        if (!localUser) {
          // 로컬에 없으면 생성
          const hashedPassword = cfUser.password 
            ? await bcrypt.hash(cfUser.password, 10)
            : await bcrypt.hash('default-password-' + Math.random().toString(36), 10);

          const createdUser = await prisma.user.create({
            data: {
              email: cfUser.email,
              password: hashedPassword,
              name: cfUser.name,
              role: cfUser.role || 'STUDENT',
              phone: cfUser.phone,
              grade: cfUser.grade,
              studentId: cfUser.studentId,
              studentCode: cfUser.studentCode,
              parentPhone: cfUser.parentPhone,
              academyId: cfUser.academyId,
              approved: cfUser.approved !== false, // 기본값 true
              cloudflareUserId: cfUser.id,
            },
          });

          results.push({
            success: true,
            operation: 'CREATE',
            entity: 'USER',
            localId: createdUser.id,
            externalId: cfUser.id,
            timestamp: new Date(),
          });

          created++;
          console.log(`✅ 사용자 생성: ${cfUser.email} (${cfUser.role})`);
        } else {
          // 로컬에 있으면 업데이트 (비밀번호는 유지)
          await prisma.user.update({
            where: { id: localUser.id },
            data: {
              name: cfUser.name,
              role: cfUser.role || localUser.role,
              phone: cfUser.phone || localUser.phone,
              grade: cfUser.grade || localUser.grade,
              studentId: cfUser.studentId || localUser.studentId,
              studentCode: cfUser.studentCode || localUser.studentCode,
              parentPhone: cfUser.parentPhone || localUser.parentPhone,
              academyId: cfUser.academyId || localUser.academyId,
              approved: cfUser.approved !== false,
              cloudflareUserId: cfUser.id,
              updatedAt: new Date(),
            },
          });

          results.push({
            success: true,
            operation: 'UPDATE',
            entity: 'USER',
            localId: localUser.id,
            externalId: cfUser.id,
            timestamp: new Date(),
          });

          updated++;
          console.log(`✅ 사용자 업데이트: ${cfUser.email} (${cfUser.role})`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          operation: 'SYNC',
          entity: 'USER',
          externalId: cfUser.id,
          error: errorMsg,
          timestamp: new Date(),
        });

        errors.push(`${cfUser.email}: ${errorMsg}`);
        failed++;
        console.error(`❌ 사용자 동기화 실패 (${cfUser.email}):`, error);
      }
    }

    console.log(`✅ 전체 사용자 동기화 완료 - 생성: ${created}, 업데이트: ${updated}, 실패: ${failed}`);

    return {
      totalUsers: cloudflareUsers.length,
      created,
      updated,
      failed,
      errors,
      results,
    };
  } catch (error) {
    console.error('❌ 전체 사용자 동기화 중 오류:', error);
    throw error;
  }
}

/**
 * 특정 학원의 학생 부가정보까지 동기화
 */
export async function syncStudentExtendedData(academyId: string): Promise<any> {
  console.log(`🔄 학원 ${academyId} 학생 부가정보 동기화 시작...`);

  try {
    // 1. 해당 학원의 모든 학생 가져오기
    const students = await prisma.user.findMany({
      where: {
        academyId,
        role: 'STUDENT',
      },
      include: {
        learningProgress: true,
        assignments: true,
        testScores: true,
        attendances: true,
        homeworkSubmissions: true,
      },
    });

    console.log(`📥 학원 ${academyId}의 학생 ${students.length}명 조회 완료`);

    // 2. Cloudflare에서 학생 부가정보 가져오기 (필요시 구현)
    // 현재는 로컬 데이터만 확인

    return {
      success: true,
      academyId,
      totalStudents: students.length,
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        studentCode: s.studentCode,
        learningProgress: s.learningProgress.length,
        assignments: s.assignments.length,
        testScores: s.testScores.length,
        attendances: s.attendances.length,
        homeworkSubmissions: s.homeworkSubmissions.length,
      })),
    };
  } catch (error) {
    console.error('❌ 학생 부가정보 동기화 실패:', error);
    throw error;
  }
}

/**
 * 모든 학원의 학생 부가정보 동기화
 */
export async function syncAllStudentsExtendedData(): Promise<any> {
  console.log('🔄 전체 학원 학생 부가정보 동기화 시작...');

  try {
    // 1. 모든 학원 조회
    const academies = await prisma.academy.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    });

    console.log(`📥 활성 학원 ${academies.length}개 조회 완료`);

    // 2. 각 학원별로 학생 부가정보 동기화
    const reports = [];

    for (const academy of academies) {
      try {
        const report = await syncStudentExtendedData(academy.id);
        reports.push({
          academyId: academy.id,
          academyName: academy.name,
          academyCode: academy.code,
          ...report,
        });
        console.log(`✅ ${academy.name} 동기화 완료`);
      } catch (error) {
        reports.push({
          academyId: academy.id,
          academyName: academy.name,
          academyCode: academy.code,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`❌ ${academy.name} 동기화 실패:`, error);
      }
    }

    return {
      success: true,
      totalAcademies: academies.length,
      reports,
    };
  } catch (error) {
    console.error('❌ 전체 학생 부가정보 동기화 실패:', error);
    throw error;
  }
}
