/**
 * 학생 코드 생성 및 관리 유틸리티
 */

import { prisma } from "@/lib/prisma";

/**
 * 5자리 숫자 코드 생성
 */
export function generateStudentCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * 고유한 학생 코드 생성 (중복 체크)
 */
export async function generateUniqueStudentCode(): Promise<string> {
  let code = generateStudentCode();
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const existing = await prisma.user.findUnique({
      where: { studentCode: code },
    });

    if (!existing) {
      return code;
    }

    code = generateStudentCode();
    attempts++;
  }

  throw new Error("학생 코드 생성 실패: 최대 시도 횟수 초과");
}

/**
 * 학생 코드로 사용자 찾기
 */
export async function findUserByStudentCode(code: string) {
  return await prisma.user.findUnique({
    where: { studentCode: code },
    include: {
      academy: true,
    },
  });
}

/**
 * 학생에게 코드 할당
 */
export async function assignStudentCode(userId: string): Promise<string> {
  const code = await generateUniqueStudentCode();

  await prisma.user.update({
    where: { id: userId },
    data: { studentCode: code },
  });

  return code;
}

/**
 * 학원별 순차적인 학번 생성
 * @param academyId 학원 ID (없으면 전체 학생 중 최대값 사용)
 * @returns 학번 (예: STU-001, STU-002, ...)
 */
export async function generateUniqueStudentId(academyId?: string | null): Promise<string> {
  try {
    // 학원별 또는 전체 학생 중 가장 큰 학번 찾기
    const whereCondition = academyId ? { academyId, role: "STUDENT" } : { role: "STUDENT" };
    
    const lastStudent = await prisma.user.findFirst({
      where: {
        ...whereCondition,
        studentId: {
          not: null,
        },
      },
      orderBy: {
        studentId: 'desc',
      },
      select: {
        studentId: true,
      },
    });

    let nextNumber = 1;

    if (lastStudent?.studentId) {
      // 기존 학번에서 숫자 부분 추출 (예: "STU-001" -> 1)
      const match = lastStudent.studentId.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // 새 학번 생성 (3자리 숫자, 앞에 0 채우기)
    const studentId = `STU-${nextNumber.toString().padStart(3, '0')}`;

    // 중복 체크 (만약을 위해)
    const existing = await prisma.user.findUnique({
      where: { studentId },
    });

    if (existing) {
      // 중복이 있으면 다음 번호로 재귀 호출
      return generateUniqueStudentId(academyId);
    }

    return studentId;
  } catch (error) {
    console.error('학번 생성 오류:', error);
    // 오류 발생 시 현재 시간 기반 학번 생성
    const timestamp = Date.now().toString().slice(-6);
    return `STU-${timestamp}`;
  }
}
