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
