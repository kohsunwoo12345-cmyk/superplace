import { prisma } from './prisma';
import { externalDB, isExternalDBEnabled } from './external-db';

/**
 * 데이터 동기화 유틸리티
 * 로컬 DB와 외부 DB 간의 데이터를 실시간으로 동기화
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
 * 학생 데이터 동기화
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

    // 2. 외부 DB 동기화 (옵션이 활성화된 경우)
    if (!options?.skipExternal && isExternalDBEnabled() && externalDB) {
      let externalStudent;
      
      // 외부 DB에서 이메일로 기존 학생 찾기
      const existingExternal = operation !== 'DELETE' 
        ? await externalDB.user.findUnique({
            where: { email: studentData.email },
          })
        : null;

      if (operation === 'CREATE') {
        if (existingExternal) {
          // 이미 존재하면 업데이트
          externalStudent = await externalDB.user.update({
            where: { id: existingExternal.id },
            data: {
              ...studentData,
              role: 'STUDENT',
            },
          });
        } else {
          // 새로 생성
          externalStudent = await externalDB.user.create({
            data: {
              ...studentData,
              role: 'STUDENT',
            },
          });
        }
        result.externalId = externalStudent.id;
      } else if (operation === 'UPDATE') {
        if (existingExternal) {
          externalStudent = await externalDB.user.update({
            where: { id: existingExternal.id },
            data: studentData,
          });
          result.externalId = externalStudent.id;
        }
      } else if (operation === 'DELETE') {
        if (existingExternal) {
          await externalDB.user.delete({
            where: { id: existingExternal.id },
          });
          result.externalId = existingExternal.id;
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
 * 선생님 데이터 동기화
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

    // 2. 외부 DB 동기화
    if (!options?.skipExternal && isExternalDBEnabled() && externalDB) {
      const existingExternal = operation !== 'DELETE'
        ? await externalDB.user.findUnique({
            where: { email: teacherData.email },
          })
        : null;

      if (operation === 'CREATE') {
        let externalTeacher;
        if (existingExternal) {
          externalTeacher = await externalDB.user.update({
            where: { id: existingExternal.id },
            data: {
              ...teacherData,
              role: 'TEACHER',
            },
          });
        } else {
          externalTeacher = await externalDB.user.create({
            data: {
              ...teacherData,
              role: 'TEACHER',
            },
          });
        }
        result.externalId = externalTeacher.id;
      } else if (operation === 'UPDATE') {
        if (existingExternal) {
          const externalTeacher = await externalDB.user.update({
            where: { id: existingExternal.id },
            data: teacherData,
          });
          result.externalId = externalTeacher.id;
        }
      } else if (operation === 'DELETE') {
        if (existingExternal) {
          await externalDB.user.delete({
            where: { id: existingExternal.id },
          });
          result.externalId = existingExternal.id;
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
    
    // TODO: 동기화 로그를 DB에 저장 (선택사항)
  } catch (error) {
    console.error('동기화 로그 저장 실패:', error);
  }
}

/**
 * 외부 DB에서 학생 목록 가져오기
 */
export async function fetchStudentsFromExternal(academyId: string) {
  if (!isExternalDBEnabled() || !externalDB) {
    return [];
  }

  try {
    const students = await externalDB.user.findMany({
      where: {
        role: 'STUDENT',
        academyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        grade: true,
        class: true,
        studentId: true,
        phone: true,
        parentPhone: true,
        approved: true,
        createdAt: true,
      },
    });
    return students;
  } catch (error) {
    console.error('외부 DB에서 학생 조회 실패:', error);
    return [];
  }
}

/**
 * 외부 DB에서 선생님 목록 가져오기
 */
export async function fetchTeachersFromExternal(academyId: string) {
  if (!isExternalDBEnabled() || !externalDB) {
    return [];
  }

  try {
    const teachers = await externalDB.user.findMany({
      where: {
        role: 'TEACHER',
        academyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        approved: true,
        createdAt: true,
      },
    });
    return teachers;
  } catch (error) {
    console.error('외부 DB에서 선생님 조회 실패:', error);
    return [];
  }
}
