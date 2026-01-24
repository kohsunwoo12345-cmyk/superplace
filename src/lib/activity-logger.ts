/**
 * 활동 로그 기록 헬퍼 함수
 * API 라우트에서 사용자 활동을 기록할 때 사용
 */

import { prisma } from '@/lib/prisma';

export interface ActivityLogData {
  userId: string;
  sessionId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 활동 로그 생성
 */
export async function createActivityLog(data: ActivityLogData) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId || null,
        action: data.action,
        resource: data.resource || null,
        resourceId: data.resourceId || null,
        description: data.description || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
    return log;
  } catch (error) {
    console.error('활동 로그 생성 실패:', error);
    return null;
  }
}

/**
 * 활동 유형 상수
 */
export const ActivityType = {
  // 인증
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  
  // 페이지 조회
  PAGE_VIEW: 'PAGE_VIEW',
  
  // 학생 관리
  STUDENT_ADD: 'STUDENT_ADD',
  STUDENT_EDIT: 'STUDENT_EDIT',
  STUDENT_DELETE: 'STUDENT_DELETE',
  STUDENT_DETAIL: 'STUDENT_DETAIL',
  STUDENT_APPROVE: 'STUDENT_APPROVE',
  
  // 선생님 관리
  TEACHER_ADD: 'TEACHER_ADD',
  TEACHER_EDIT: 'TEACHER_EDIT',
  TEACHER_DELETE: 'TEACHER_DELETE',
  TEACHER_APPROVE: 'TEACHER_APPROVE',
  
  // AI 봇
  AI_CHAT: 'AI_CHAT',
  AI_BOT_ASSIGN: 'AI_BOT_ASSIGN',
  AI_BOT_REVOKE: 'AI_BOT_REVOKE',
  AI_ANALYSIS: 'AI_ANALYSIS',
  
  // 과제
  ASSIGNMENT_CREATE: 'ASSIGNMENT_CREATE',
  ASSIGNMENT_SUBMIT: 'ASSIGNMENT_SUBMIT',
  ASSIGNMENT_GRADE: 'ASSIGNMENT_GRADE',
  
  // 성적
  GRADE_INPUT: 'GRADE_INPUT',
  GRADE_UPDATE: 'GRADE_UPDATE',
  
  // 출석
  ATTENDANCE_CHECK: 'ATTENDANCE_CHECK',
  
  // 수업
  CLASS_CREATE: 'CLASS_CREATE',
  CLASS_UPDATE: 'CLASS_UPDATE',
  CLASS_DELETE: 'CLASS_DELETE',
  
  // 학습 자료
  MATERIAL_UPLOAD: 'MATERIAL_UPLOAD',
  MATERIAL_DOWNLOAD: 'MATERIAL_DOWNLOAD',
  
  // 계정 전환
  ACCOUNT_SWITCH: 'ACCOUNT_SWITCH',
  ACCOUNT_SWITCH_BACK: 'ACCOUNT_SWITCH_BACK',
} as const;

/**
 * 리소스 유형 상수
 */
export const ResourceType = {
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  ASSIGNMENTS: 'assignments',
  GRADES: 'grades',
  ATTENDANCE: 'attendance',
  MATERIALS: 'materials',
  AI_BOTS: 'ai-bots',
  PAGES: 'pages',
  AUTH: 'auth',
  ACCOUNT_SWITCH: 'account-switch',
} as const;

/**
 * 요청에서 IP 주소와 User Agent 추출
 */
export function extractRequestInfo(request: Request) {
  const headers = request.headers;
  
  const ipAddress = 
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown';
  
  const userAgent = headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}
