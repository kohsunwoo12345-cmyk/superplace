import { prisma } from './prisma';
import {
  fetchCloudflareUsersByAcademy,
  fetchCloudflareStudentsByAcademy,
  fetchCloudflareClassesByAcademy,
  fetchCloudflareStudentClasses,
  pushUserToCloudflare,
  pushStudentToCloudflare,
  pushClassToCloudflare,
  pushStudentClassToCloudflare,
  deleteStudentFromCloudflare,
  deleteClassFromCloudflare,
  CloudflareUser,
  CloudflareStudent,
  CloudflareClass,
} from './cloudflare-api';
import bcrypt from 'bcryptjs';

export interface SyncResult {
  success: boolean;
  operation: string;
  entity: string;
  localId?: string;
  externalId?: string;
  error?: string;
  timestamp: Date;
}

export interface UserSyncReport {
  academyId: string;
  academyName?: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  students: {
    created: number;
    updated: number;
    deleted: number;
    failed: number;
  };
  classes: {
    created: number;
    updated: number;
    deleted: number;
    failed: number;
  };
  studentClasses: {
    assigned: number;
    unassigned: number;
    failed: number;
  };
  errors: string[];
}

/**
 * 특정 학원의 학생 데이터를 Cloudflare와 동기화
 */
export async function syncStudentsForAcademy(
  academyId: string
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  try {
    console.log(`🔄 학원 학생 동기화 시작 (학원: ${academyId})`);

    // 1. Cloudflare에서 학생 데이터 가져오기 (optional)
    let cloudflareStudents: CloudflareStudent[] = [];
    try {
      cloudflareStudents = await fetchCloudflareStudentsByAcademy(academyId);
      console.log(`📥 Cloudflare 학생 ${cloudflareStudents.length}명 조회`);
    } catch (error) {
      console.warn(`⚠️  Cloudflare 학생 데이터 조회 실패 (스킵):`, error);
    }

    // 2. 로컬 DB의 학생 데이터 가져오기
    const localStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        academyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
        studentId: true,
        studentCode: true,
        parentPhone: true,
        approved: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log(`📥 로컬 학생 ${localStudents.length}명 조회`);

    // 3. Cloudflare → 로컬 동기화 (Cloudflare 데이터를 로컬로 가져오기)
    for (const cfStudent of cloudflareStudents) {
      try {
        const localStudent = localStudents.find(s => s.email === cfStudent.email);

        if (!localStudent) {
          // 로컬에 없으면 생성
          const hashedPassword = cfStudent.password 
            ? await bcrypt.hash(cfStudent.password, 10)
            : await bcrypt.hash('default-password-' + Math.random().toString(36), 10);

          const created = await prisma.user.create({
            data: {
              email: cfStudent.email,
              password: hashedPassword,
              name: cfStudent.name,
              phone: cfStudent.phone,
              grade: cfStudent.grade,
              studentId: cfStudent.studentId,
              studentCode: cfStudent.studentCode,
              parentPhone: cfStudent.parentPhone,
              academyId: cfStudent.academyId,
              role: 'STUDENT',
              approved: cfStudent.approved,
              cloudflareUserId: cfStudent.id,
            },
          });

          results.push({
            success: true,
            operation: 'CREATE_FROM_CLOUDFLARE',
            entity: 'STUDENT',
            localId: created.id,
            externalId: cfStudent.id,
            timestamp: new Date(),
          });

          console.log(`✅ 학생 생성 (Cloudflare → 로컬): ${cfStudent.email}`);
        } else {
          // 로컬에 있으면 업데이트
          await prisma.user.update({
            where: { id: localStudent.id },
            data: {
              name: cfStudent.name,
              phone: cfStudent.phone,
              grade: cfStudent.grade,
              studentId: cfStudent.studentId,
              studentCode: cfStudent.studentCode,
              parentPhone: cfStudent.parentPhone,
              approved: cfStudent.approved,
              cloudflareUserId: cfStudent.id,
              updatedAt: new Date(),
            },
          });

          results.push({
            success: true,
            operation: 'UPDATE_FROM_CLOUDFLARE',
            entity: 'STUDENT',
            localId: localStudent.id,
            externalId: cfStudent.id,
            timestamp: new Date(),
          });

          console.log(`✅ 학생 업데이트 (Cloudflare → 로컬): ${cfStudent.email}`);
        }
      } catch (error) {
        results.push({
          success: false,
          operation: 'SYNC_FROM_CLOUDFLARE',
          entity: 'STUDENT',
          externalId: cfStudent.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });

        console.error(`❌ 학생 동기화 실패 (${cfStudent.email}):`, error);
      }
    }

    // 4. 로컬 → Cloudflare 동기화 (로컬 데이터를 Cloudflare로 전송)
    const cfStudentEmails = new Set(cloudflareStudents.map(s => s.email));
    
    for (const localStudent of localStudents) {
      try {
        if (!cfStudentEmails.has(localStudent.email)) {
          // Cloudflare에 없으면 생성
          const cfStudentData: CloudflareStudent = {
            id: localStudent.id,
            email: localStudent.email,
            name: localStudent.name,
            phone: localStudent.phone || undefined,
            grade: localStudent.grade || undefined,
            studentId: localStudent.studentId || undefined,
            studentCode: localStudent.studentCode || undefined,
            parentPhone: localStudent.parentPhone || undefined,
            academyId,
            approved: localStudent.approved,
            createdAt: localStudent.createdAt.toISOString(),
          };

          try {
            const pushResult = await pushStudentToCloudflare(cfStudentData, 'CREATE');

            results.push({
              success: pushResult.success,
              operation: 'CREATE_TO_CLOUDFLARE',
              entity: 'STUDENT',
              localId: localStudent.id,
              externalId: pushResult.externalId,
              error: pushResult.error,
              timestamp: new Date(),
            });

            if (pushResult.success) {
              console.log(`✅ 학생 생성 (로컬 → Cloudflare): ${localStudent.email}`);
            } else {
              console.error(`❌ 학생 생성 실패 (로컬 → Cloudflare): ${localStudent.email}`);
            }
          } catch (pushError) {
            console.warn(`⚠️  Cloudflare 푸시 실패 (스킵): ${localStudent.email}`, pushError);
          }
        }
      } catch (error) {
        results.push({
          success: false,
          operation: 'SYNC_TO_CLOUDFLARE',
          entity: 'STUDENT',
          localId: localStudent.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });

        console.error(`❌ 학생 동기화 실패 (${localStudent.email}):`, error);
      }
    }

    console.log(`✅ 학원 학생 동기화 완료 (학원: ${academyId})`);
  } catch (error) {
    console.error(`❌ 학원 학생 동기화 실패 (학원: ${academyId}):`, error);
  }

  return results;
}

/**
 * 특정 학원의 반 데이터를 Cloudflare와 동기화
 */
export async function syncClassesForAcademy(
  academyId: string
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  try {
    console.log(`🔄 학원 반 동기화 시작 (학원: ${academyId})`);

    // 1. Cloudflare에서 반 데이터 가져오기 (optional)
    let cloudflareClasses: CloudflareClass[] = [];
    try {
      cloudflareClasses = await fetchCloudflareClassesByAcademy(academyId);
      console.log(`📥 Cloudflare 반 ${cloudflareClasses.length}개 조회`);
    } catch (error) {
      console.warn(`⚠️  Cloudflare 반 데이터 조회 실패 (스킵):`, error);
    }

    // 2. 로컬 DB의 반 데이터 가져오기
    const localClasses = await prisma.class.findMany({
      where: { academyId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    console.log(`📥 로컬 반 ${localClasses.length}개 조회`);

    // 3. Cloudflare → 로컬 동기화
    for (const cfClass of cloudflareClasses) {
      try {
        const localClass = localClasses.find(c => c.name === cfClass.name && c.grade === cfClass.grade);

        if (!localClass) {
          // 로컬에 없으면 생성
          const created = await prisma.class.create({
            data: {
              name: cfClass.name,
              grade: cfClass.grade,
              description: cfClass.description,
              teacherId: cfClass.teacherId,
              academyId: cfClass.academyId,
              maxStudents: cfClass.maxStudents || 30,
              schedule: cfClass.schedule,
            },
          });

          results.push({
            success: true,
            operation: 'CREATE_FROM_CLOUDFLARE',
            entity: 'CLASS',
            localId: created.id,
            externalId: cfClass.id,
            timestamp: new Date(),
          });

          console.log(`✅ 반 생성 (Cloudflare → 로컬): ${cfClass.name}`);
        } else {
          // 로컬에 있으면 업데이트
          await prisma.class.update({
            where: { id: localClass.id },
            data: {
              name: cfClass.name,
              grade: cfClass.grade,
              description: cfClass.description,
              teacherId: cfClass.teacherId,
              maxStudents: cfClass.maxStudents || localClass.maxStudents,
              schedule: cfClass.schedule,
              updatedAt: new Date(),
            },
          });

          results.push({
            success: true,
            operation: 'UPDATE_FROM_CLOUDFLARE',
            entity: 'CLASS',
            localId: localClass.id,
            externalId: cfClass.id,
            timestamp: new Date(),
          });

          console.log(`✅ 반 업데이트 (Cloudflare → 로컬): ${cfClass.name}`);
        }
      } catch (error) {
        results.push({
          success: false,
          operation: 'SYNC_FROM_CLOUDFLARE',
          entity: 'CLASS',
          externalId: cfClass.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });

        console.error(`❌ 반 동기화 실패 (${cfClass.name}):`, error);
      }
    }

    // 4. 로컬 → Cloudflare 동기화
    const cfClassNames = new Set(cloudflareClasses.map(c => `${c.name}-${c.grade}`));
    
    for (const localClass of localClasses) {
      try {
        const classKey = `${localClass.name}-${localClass.grade}`;
        
        if (!cfClassNames.has(classKey)) {
          // Cloudflare에 없으면 생성
          const cfClassData: CloudflareClass = {
            id: localClass.id,
            name: localClass.name,
            grade: localClass.grade,
            description: localClass.description || undefined,
            teacherId: localClass.teacherId || undefined,
            academyId,
            maxStudents: localClass.maxStudents,
            schedule: localClass.schedule || undefined,
            createdAt: localClass.createdAt.toISOString(),
          };

          const pushResult = await pushClassToCloudflare(cfClassData, 'CREATE');

          results.push({
            success: pushResult.success,
            operation: 'CREATE_TO_CLOUDFLARE',
            entity: 'CLASS',
            localId: localClass.id,
            externalId: pushResult.externalId,
            error: pushResult.error,
            timestamp: new Date(),
          });

          if (pushResult.success) {
            console.log(`✅ 반 생성 (로컬 → Cloudflare): ${localClass.name}`);
          } else {
            console.error(`❌ 반 생성 실패 (로컬 → Cloudflare): ${localClass.name}`);
          }
        }
      } catch (error) {
        results.push({
          success: false,
          operation: 'SYNC_TO_CLOUDFLARE',
          entity: 'CLASS',
          localId: localClass.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });

        console.error(`❌ 반 동기화 실패 (${localClass.name}):`, error);
      }
    }

    console.log(`✅ 학원 반 동기화 완료 (학원: ${academyId})`);
  } catch (error) {
    console.error(`❌ 학원 반 동기화 실패 (학원: ${academyId}):`, error);
  }

  return results;
}

/**
 * 특정 학원의 모든 데이터를 Cloudflare와 동기화
 */
export async function syncAcademyData(
  academyId: string,
  userId: string
): Promise<UserSyncReport> {
  const startTime = new Date();
  const report: UserSyncReport = {
    academyId,
    userId,
    userName: '',
    startTime,
    students: { created: 0, updated: 0, deleted: 0, failed: 0 },
    classes: { created: 0, updated: 0, deleted: 0, failed: 0 },
    studentClasses: { assigned: 0, unassigned: 0, failed: 0 },
    errors: [],
  };

  try {
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    report.userName = user?.name || 'Unknown';

    // 학원 정보 조회
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: { name: true },
    });
    report.academyName = academy?.name;

    console.log(`\n🚀 ${report.academyName} 학원 데이터 동기화 시작 (사용자: ${report.userName})`);
    console.log(`====================================`);

    // 1. 학생 데이터 동기화
    const studentResults = await syncStudentsForAcademy(academyId);
    for (const result of studentResults) {
      if (result.success) {
        if (result.operation.includes('CREATE')) report.students.created++;
        else if (result.operation.includes('UPDATE')) report.students.updated++;
        else if (result.operation.includes('DELETE')) report.students.deleted++;
      } else {
        report.students.failed++;
        if (result.error) report.errors.push(`학생 동기화 실패: ${result.error}`);
      }
    }

    // 2. 반 데이터 동기화
    const classResults = await syncClassesForAcademy(academyId);
    for (const result of classResults) {
      if (result.success) {
        if (result.operation.includes('CREATE')) report.classes.created++;
        else if (result.operation.includes('UPDATE')) report.classes.updated++;
        else if (result.operation.includes('DELETE')) report.classes.deleted++;
      } else {
        report.classes.failed++;
        if (result.error) report.errors.push(`반 동기화 실패: ${result.error}`);
      }
    }

    report.endTime = new Date();
    const duration = ((report.endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);

    console.log(`\n====================================`);
    console.log(`✅ 동기화 완료 (소요 시간: ${duration}초)`);
    console.log(`학생: 생성 ${report.students.created}, 업데이트 ${report.students.updated}, 삭제 ${report.students.deleted}, 실패 ${report.students.failed}`);
    console.log(`반: 생성 ${report.classes.created}, 업데이트 ${report.classes.updated}, 삭제 ${report.classes.deleted}, 실패 ${report.classes.failed}`);
    
    if (report.errors.length > 0) {
      console.log(`\n⚠️  오류 ${report.errors.length}건 발생:`);
      report.errors.forEach((error, idx) => console.log(`  ${idx + 1}. ${error}`));
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    report.errors.push(`전체 동기화 실패: ${errorMessage}`);
    console.error(`❌ 학원 데이터 동기화 실패 (학원: ${academyId}):`, error);
  }

  return report;
}

/**
 * 모든 학원의 데이터를 동기화 (관리자 전용)
 */
export async function syncAllAcademies(): Promise<UserSyncReport[]> {
  const reports: UserSyncReport[] = [];

  try {
    const academies = await prisma.academy.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        director: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`\n🌐 전체 학원 동기화 시작 (${academies.length}개 학원)`);
    console.log(`====================================\n`);

    for (const academy of academies) {
      const directorId = academy.director?.id || 'system';
      const report = await syncAcademyData(academy.id, directorId);
      reports.push(report);
    }

    console.log(`\n====================================`);
    console.log(`🎉 전체 학원 동기화 완료 (${academies.length}개 학원)`);
    
    // 전체 통계
    const totalStats = reports.reduce((acc, report) => ({
      students: {
        created: acc.students.created + report.students.created,
        updated: acc.students.updated + report.students.updated,
        deleted: acc.students.deleted + report.students.deleted,
        failed: acc.students.failed + report.students.failed,
      },
      classes: {
        created: acc.classes.created + report.classes.created,
        updated: acc.classes.updated + report.classes.updated,
        deleted: acc.classes.deleted + report.classes.deleted,
        failed: acc.classes.failed + report.classes.failed,
      },
    }), {
      students: { created: 0, updated: 0, deleted: 0, failed: 0 },
      classes: { created: 0, updated: 0, deleted: 0, failed: 0 },
    });

    console.log(`전체 학생: 생성 ${totalStats.students.created}, 업데이트 ${totalStats.students.updated}, 삭제 ${totalStats.students.deleted}, 실패 ${totalStats.students.failed}`);
    console.log(`전체 반: 생성 ${totalStats.classes.created}, 업데이트 ${totalStats.classes.updated}, 삭제 ${totalStats.classes.deleted}, 실패 ${totalStats.classes.failed}`);

  } catch (error) {
    console.error('❌ 전체 학원 동기화 실패:', error);
  }

  return reports;
}

