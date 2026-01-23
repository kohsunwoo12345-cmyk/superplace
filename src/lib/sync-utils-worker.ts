import { prisma } from './prisma';
import { createWorkerDBClient } from './worker-db-client';

/**
 * 데이터 동기화 유틸리티 (Worker 버전)
 * Cloudflare Worker를 통해 D1 데이터베이스와 동기화
 */

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntity = 'STUDENT' | 'TEACHER' | 'CLASS' | 'ACADEMY';

interface SyncResult {
  success: boolean;
  operation: SyncOperation;
  entity: SyncEntity;
  localId?: string;
  externalId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Worker DB 클라이언트 생성
 */
function getWorkerClient() {
  try {
    return createWorkerDBClient();
  } catch (error) {
    console.warn('Worker DB client not configured:', error);
    return null;
  }
}

/**
 * Worker DB 사용 가능 여부 확인
 */
export function isWorkerDBEnabled(): boolean {
  return !!process.env.CLOUDFLARE_WORKER_URL && !!process.env.CLOUDFLARE_WORKER_TOKEN;
}

/**
 * 학생 데이터 동기화 (Worker 버전)
 */
export async function syncStudent(
  operation: SyncOperation,
  studentData: any,
  options?: { skipExternal?: boolean }
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    operation,
    entity: 'STUDENT',
    timestamp: new Date(),
  };

  try {
    // 1. 로컬 DB 작업
    let localStudent;
    
    if (operation === 'CREATE') {
      localStudent = await prisma.user.create({
        data: {
          ...studentData,
          role: 'STUDENT',
        },
      });
      result.localId = localStudent.id;
    } else if (operation === 'UPDATE') {
      localStudent = await prisma.user.update({
        where: { id: studentData.id },
        data: studentData,
      });
      result.localId = localStudent.id;
    } else if (operation === 'DELETE') {
      await prisma.user.delete({
        where: { id: studentData.id },
      });
      result.localId = studentData.id;
    }

    // 2. Worker DB 동기화
    if (!options?.skipExternal && isWorkerDBEnabled()) {
      const workerClient = getWorkerClient();
      if (workerClient) {
        try {
          if (operation === 'CREATE') {
            // 이메일로 기존 학생 확인
            const existing = await workerClient.queryFirst(
              'SELECT id FROM User WHERE email = ? AND role = ?',
              [studentData.email, 'STUDENT']
            );

            if (existing) {
              // 업데이트
              await workerClient.crud({
                operation: 'UPDATE',
                table: 'User',
                data: {
                  ...studentData,
                  role: 'STUDENT',
                },
                where: { id: existing.id },
              });
              result.externalId = existing.id;
            } else {
              // 새로 생성
              const writeResult = await workerClient.write(
                `INSERT INTO User (email, name, password, role, grade, studentId, phone, parentPhone, academyId, approved, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  studentData.email,
                  studentData.name,
                  studentData.password,
                  'STUDENT',
                  studentData.grade || null,
                  studentData.studentId || null,
                  studentData.phone || null,
                  studentData.parentPhone || null,
                  studentData.academyId,
                  studentData.approved ? 1 : 0,
                ]
              );
              
              // ID 조회
              const created = await workerClient.queryFirst(
                'SELECT id FROM User WHERE email = ?',
                [studentData.email]
              );
              result.externalId = created?.id;
            }
          } else if (operation === 'UPDATE') {
            // 이메일로 찾아서 업데이트
            const existing = await workerClient.queryFirst(
              'SELECT id FROM User WHERE email = ?',
              [studentData.email]
            );

            if (existing) {
              await workerClient.crud({
                operation: 'UPDATE',
                table: 'User',
                data: studentData,
                where: { id: existing.id },
              });
              result.externalId = existing.id;
            }
          } else if (operation === 'DELETE') {
            // 이메일로 찾아서 삭제
            const existing = await workerClient.queryFirst(
              'SELECT id FROM User WHERE email = ?',
              [studentData.email]
            );

            if (existing) {
              await workerClient.crud({
                operation: 'DELETE',
                table: 'User',
                where: { id: existing.id },
              });
              result.externalId = existing.id;
            }
          }
        } catch (workerError) {
          console.error('Worker DB sync failed:', workerError);
          // Worker 실패는 로그만 남기고 계속 진행
        }
      }
    }

    result.success = true;
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ 학생 동기화 실패 (${operation}):`, error);
  }

  return result;
}

/**
 * 선생님 데이터 동기화 (Worker 버전)
 */
export async function syncTeacher(
  operation: SyncOperation,
  teacherData: any,
  options?: { skipExternal?: boolean }
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    operation,
    entity: 'TEACHER',
    timestamp: new Date(),
  };

  try {
    // 1. 로컬 DB 작업
    let localTeacher;
    
    if (operation === 'CREATE') {
      localTeacher = await prisma.user.create({
        data: {
          ...teacherData,
          role: 'TEACHER',
        },
      });
      result.localId = localTeacher.id;
    } else if (operation === 'UPDATE') {
      localTeacher = await prisma.user.update({
        where: { id: teacherData.id },
        data: teacherData,
      });
      result.localId = localTeacher.id;
    } else if (operation === 'DELETE') {
      await prisma.user.delete({
        where: { id: teacherData.id },
      });
      result.localId = teacherData.id;
    }

    // 2. Worker DB 동기화
    if (!options?.skipExternal && isWorkerDBEnabled()) {
      const workerClient = getWorkerClient();
      if (workerClient) {
        try {
          if (operation === 'CREATE') {
            const existing = await workerClient.queryFirst(
              'SELECT id FROM User WHERE email = ? AND role = ?',
              [teacherData.email, 'TEACHER']
            );

            if (existing) {
              await workerClient.crud({
                operation: 'UPDATE',
                table: 'User',
                data: {
                  ...teacherData,
                  role: 'TEACHER',
                },
                where: { id: existing.id },
              });
              result.externalId = existing.id;
            } else {
              await workerClient.write(
                `INSERT INTO User (email, name, password, role, phone, academyId, approved, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  teacherData.email,
                  teacherData.name,
                  teacherData.password,
                  'TEACHER',
                  teacherData.phone || null,
                  teacherData.academyId,
                  teacherData.approved ? 1 : 0,
                ]
              );
              
              const created = await workerClient.queryFirst(
                'SELECT id FROM User WHERE email = ?',
                [teacherData.email]
              );
              result.externalId = created?.id;
            }
          } else if (operation === 'UPDATE') {
            const existing = await workerClient.queryFirst(
              'SELECT id FROM User WHERE email = ?',
              [teacherData.email]
            );

            if (existing) {
              await workerClient.crud({
                operation: 'UPDATE',
                table: 'User',
                data: teacherData,
                where: { id: existing.id },
              });
              result.externalId = existing.id;
            }
          } else if (operation === 'DELETE') {
            const existing = await workerClient.queryFirst(
              'SELECT id FROM User WHERE email = ?',
              [teacherData.email]
            );

            if (existing) {
              await workerClient.crud({
                operation: 'DELETE',
                table: 'User',
                where: { id: existing.id },
              });
              result.externalId = existing.id;
            }
          }
        } catch (workerError) {
          console.error('Worker DB sync failed:', workerError);
        }
      }
    }

    result.success = true;
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ 선생님 동기화 실패 (${operation}):`, error);
  }

  return result;
}

/**
 * 동기화 로그 저장
 */
export async function logSync(result: SyncResult) {
  try {
    console.log(`📝 동기화 로그: ${result.entity} ${result.operation}`, {
      success: result.success,
      localId: result.localId,
      externalId: result.externalId,
      error: result.error,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('동기화 로그 저장 실패:', error);
  }
}

/**
 * Worker DB에서 학생 목록 가져오기
 */
export async function fetchStudentsFromWorker(academyId: string) {
  if (!isWorkerDBEnabled()) {
    return [];
  }

  try {
    const workerClient = getWorkerClient();
    if (!workerClient) return [];

    const students = await workerClient.getStudents(academyId);
    return students;
  } catch (error) {
    console.error('Worker DB에서 학생 조회 실패:', error);
    return [];
  }
}

/**
 * Worker DB에서 선생님 목록 가져오기
 */
export async function fetchTeachersFromWorker(academyId: string) {
  if (!isWorkerDBEnabled()) {
    return [];
  }

  try {
    const workerClient = getWorkerClient();
    if (!workerClient) return [];

    const teachers = await workerClient.query(
      'SELECT id, email, name, phone, approved, createdAt FROM User WHERE role = ? AND academyId = ?',
      ['TEACHER', academyId]
    );
    return teachers;
  } catch (error) {
    console.error('Worker DB에서 선생님 조회 실패:', error);
    return [];
  }
}
