/**
 * Cloudflare D1 데이터베이스 동기화 유틸리티
 * 
 * Cloudflare 웹사이트: https://superplace-academy.pages.dev
 * D1 Database ID: 8c106540-21b4-4fa9-8879-c4956e459ca1
 */

interface CloudflareUser {
  id: string;
  email: string;
  password: string; // 해시된 비밀번호
  name: string;
  phone?: string;
  role: string;
  grade?: string;
  academyId?: string;
  createdAt: string;
}

interface CloudflareStudent {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  grade?: string;
  parentPhone?: string;
  academyId?: string;
}

/**
 * Cloudflare API를 통해 사용자 데이터 가져오기
 * 
 * 참고: Cloudflare D1에 직접 접근하려면 Cloudflare 계정 API 토큰이 필요합니다.
 * 현재는 Cloudflare 웹사이트의 공개 API 엔드포인트를 통해 접근합니다.
 */
export async function fetchCloudflareUsers(): Promise<CloudflareUser[]> {
  try {
    const response = await fetch('https://superplace-academy.pages.dev/api/users', {
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_D1_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.users || data;
  } catch (error) {
    console.error('Cloudflare 사용자 데이터 가져오기 실패:', error);
    throw error;
  }
}

/**
 * Cloudflare에서 학생 목록 가져오기
 */
export async function fetchCloudflareStudents(): Promise<CloudflareStudent[]> {
  try {
    const response = await fetch('https://superplace-academy.pages.dev/api/students/list', {
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_D1_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.students || data;
  } catch (error) {
    console.error('Cloudflare 학생 데이터 가져오기 실패:', error);
    throw error;
  }
}

/**
 * Cloudflare 로그인 검증
 * 
 * 이메일과 비밀번호를 Cloudflare API로 전송하여 검증합니다.
 * 성공 시 사용자 정보를 반환합니다.
 */
export async function verifyCloudflareLogin(
  email: string,
  password: string
): Promise<{ success: boolean; user?: CloudflareUser; error?: string }> {
  try {
    const response = await fetch('https://superplace-academy.pages.dev/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return { success: false, error: '로그인 실패' };
    }

    const data = await response.json();
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Cloudflare 로그인 검증 실패:', error);
    return { success: false, error: '서버 오류' };
  }
}

/**
 * Cloudflare 사용자를 현재 DB로 동기화
 */
export async function syncUserFromCloudflare(cloudflareUser: CloudflareUser) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // 이메일로 기존 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: cloudflareUser.email },
    });

    if (existingUser) {
      // 기존 사용자 업데이트 (비밀번호는 업데이트하지 않음)
      await prisma.user.update({
        where: { email: cloudflareUser.email },
        data: {
          name: cloudflareUser.name,
          phone: cloudflareUser.phone,
          grade: cloudflareUser.grade,
          updatedAt: new Date(),
        },
      });
      console.log(`기존 사용자 업데이트: ${cloudflareUser.email}`);
    } else {
      // 새 사용자 생성
      await prisma.user.create({
        data: {
          email: cloudflareUser.email,
          password: cloudflareUser.password, // 이미 해시된 비밀번호
          name: cloudflareUser.name,
          phone: cloudflareUser.phone,
          role: cloudflareUser.role as any,
          grade: cloudflareUser.grade,
          academyId: cloudflareUser.academyId,
          approved: true, // Cloudflare에서 온 사용자는 승인된 것으로 간주
          cloudflareUserId: cloudflareUser.id, // 원본 ID 저장
        },
      });
      console.log(`새 사용자 생성: ${cloudflareUser.email}`);
    }
  } catch (error) {
    console.error(`사용자 동기화 실패 (${cloudflareUser.email}):`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
