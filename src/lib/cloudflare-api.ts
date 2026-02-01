/**
 * Cloudflare API 클라이언트
 * 사용자, 학생, 반 데이터 동기화
 */

const CLOUDFLARE_BASE_URL = process.env.CLOUDFLARE_SITE_URL || 'https://superplace-academy.pages.dev';
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_D1_API_KEY;

export interface CloudflareUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: string; // SUPER_ADMIN, DIRECTOR, TEACHER, STUDENT
  academyId?: string;
  grade?: string;
  school?: string;
  approved: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CloudflareStudent {
  id: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  grade?: string;
  studentId?: string;
  studentCode?: string;
  parentPhone?: string;
  academyId: string;
  school?: string;
  approved: boolean;
  points?: number;
  aiChatEnabled?: boolean;
  aiHomeworkEnabled?: boolean;
  aiStudyEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CloudflareClass {
  id: string;
  name: string;
  grade: string;
  description?: string;
  teacherId?: string;
  academyId: string;
  maxStudents?: number;
  schedule?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CloudflareStudentClass {
  studentId: string;
  classId: string;
  enrolledAt: string;
}

/**
 * Cloudflare에서 특정 학원의 학생 목록 가져오기
 */
export async function fetchCloudflareStudentsByAcademy(
  academyId: string
): Promise<CloudflareStudent[]> {
  try {
    const response = await fetch(`${CLOUDFLARE_BASE_URL}/api/sync/students?academyId=${academyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.students || [];
  } catch (error) {
    console.error(`Cloudflare 학생 데이터 가져오기 실패 (학원: ${academyId}):`, error);
    return [];
  }
}

/**
 * Cloudflare에서 특정 학원의 반 목록 가져오기
 */
export async function fetchCloudflareClassesByAcademy(
  academyId: string
): Promise<CloudflareClass[]> {
  try {
    const response = await fetch(`${CLOUDFLARE_BASE_URL}/api/sync/classes?academyId=${academyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.classes || [];
  } catch (error) {
    console.error(`Cloudflare 반 데이터 가져오기 실패 (학원: ${academyId}):`, error);
    return [];
  }
}

/**
 * Cloudflare에서 특정 반의 학생 배정 정보 가져오기
 */
export async function fetchCloudflareStudentClasses(
  classId: string
): Promise<CloudflareStudentClass[]> {
  try {
    const response = await fetch(`${CLOUDFLARE_BASE_URL}/api/sync/classes/${classId}/students`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.studentClasses || [];
  } catch (error) {
    console.error(`Cloudflare 학생-반 배정 데이터 가져오기 실패 (반: ${classId}):`, error);
    return [];
  }
}

/**
 * Cloudflare로 사용자 데이터 전송 (생성/업데이트)
 */
export async function pushUserToCloudflare(
  user: CloudflareUser,
  operation: 'CREATE' | 'UPDATE'
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  try {
    const endpoint = operation === 'CREATE' 
      ? `${CLOUDFLARE_BASE_URL}/api/sync/users`
      : `${CLOUDFLARE_BASE_URL}/api/sync/users/${user.id}`;

    const method = operation === 'CREATE' ? 'POST' : 'PUT';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      externalId: data.user?.id || user.id,
    };
  } catch (error) {
    console.error(`Cloudflare 사용자 데이터 전송 실패 (${operation}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cloudflare로 학생 데이터 전송 (생성/업데이트)
 */
export async function pushStudentToCloudflare(
  student: CloudflareStudent,
  operation: 'CREATE' | 'UPDATE'
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  try {
    const endpoint = operation === 'CREATE' 
      ? `${CLOUDFLARE_BASE_URL}/api/sync/students`
      : `${CLOUDFLARE_BASE_URL}/api/sync/students/${student.id}`;

    const method = operation === 'CREATE' ? 'POST' : 'PUT';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(student),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      externalId: data.student?.id || student.id,
    };
  } catch (error) {
    console.error(`Cloudflare 학생 데이터 전송 실패 (${operation}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cloudflare에서 학생 데이터 삭제
 */
export async function deleteStudentFromCloudflare(
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CLOUDFLARE_BASE_URL}/api/sync/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Cloudflare 학생 데이터 삭제 실패:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cloudflare로 반 데이터 전송 (생성/업데이트)
 */
export async function pushClassToCloudflare(
  classData: CloudflareClass,
  operation: 'CREATE' | 'UPDATE'
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  try {
    const endpoint = operation === 'CREATE' 
      ? `${CLOUDFLARE_BASE_URL}/api/sync/classes`
      : `${CLOUDFLARE_BASE_URL}/api/sync/classes/${classData.id}`;

    const method = operation === 'CREATE' ? 'POST' : 'PUT';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(classData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Cloudflare API 오류: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      externalId: data.class?.id || classData.id,
    };
  } catch (error) {
    console.error(`Cloudflare 반 데이터 전송 실패 (${operation}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cloudflare에서 반 데이터 삭제
 */
export async function deleteClassFromCloudflare(
  classId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CLOUDFLARE_BASE_URL}/api/sync/classes/${classId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Cloudflare 반 데이터 삭제 실패:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cloudflare로 학생-반 배정 데이터 전송
 */
export async function pushStudentClassToCloudflare(
  classId: string,
  studentId: string,
  operation: 'ASSIGN' | 'UNASSIGN'
): Promise<{ success: boolean; error?: string }> {
  try {
    const endpoint = `${CLOUDFLARE_BASE_URL}/api/sync/classes/${classId}/students`;
    const method = operation === 'ASSIGN' ? 'POST' : 'DELETE';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API 오류: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Cloudflare 학생-반 배정 데이터 전송 실패 (${operation}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cloudflare API 연결 테스트
 */
export async function testCloudflareConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${CLOUDFLARE_BASE_URL}/api/health`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Cloudflare 연결 테스트 실패:', error);
    return false;
  }
}
