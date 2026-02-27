// 요금제 타입 정의

export type PlanPeriod = '1month' | '6months' | '12months';
export type PaymentMethod = 'card' | 'bank_transfer';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

// 요금제 기본 구조
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  
  // 가격 (기간별)
  pricing: {
    '1month': number;
    '6months': number;
    '12months': number;
  };
  
  // 기능 제한
  limits: {
    maxStudents: number;           // 학생 수 제한 (-1 = 무제한)
    maxTeachers: number;           // 선생님 수 제한 (-1 = 무제한)
    maxHomeworkChecks: number;     // 월별 숙제 검사 제한 (-1 = 무제한)
    maxAIAnalysis: number;         // 월별 AI 역량 분석 제한 (-1 = 무제한)
    maxAIGrading: number;          // 월별 AI 채점 제한 (-1 = 무제한)
    maxCapabilityAnalysis: number; // 월별 역량 분석 제한 (-1 = 무제한)
    maxConceptAnalysis: number;    // 월별 부족한 개념 분석 제한 (-1 = 무제한)
    maxSimilarProblems: number;    // 월별 유사문제 출제 제한 (-1 = 무제한)
    maxLandingPages: number;       // 랜딩페이지 제작 제한 (-1 = 무제한)
  };
  
  // 추가 기능
  features: string[];
  
  // 메타 정보
  isPopular: boolean;
  color: string;
  order: number;
  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// 요금제 신청
export interface SubscriptionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  
  planId: string;
  planName: string;
  period: PlanPeriod;
  paymentMethod: PaymentMethod;
  
  // 가격 정보
  originalPrice: number;
  discountedPrice: number;
  finalPrice: number;
  
  // 결제 정보
  paymentInfo?: {
    cardLast4?: string;           // 카드 마지막 4자리
    bankName?: string;            // 은행명
    accountHolder?: string;       // 예금주
    depositDate?: string;         // 입금 예정일
    receiptUrl?: string;          // 영수증 URL
  };
  
  // 신청 상태
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;             // 관리자 메모
  
  // 날짜
  requestedAt: string;
  processedAt?: string;
  
  // 승인 정보
  approvedBy?: string;
  approvedByEmail?: string;
}

// 사용자 구독 정보
export interface UserSubscription {
  id: string;
  userId: string;
  
  planId: string;
  planName: string;
  period: PlanPeriod;
  
  // 상태
  status: SubscriptionStatus;
  
  // 날짜
  startDate: string;
  endDate: string;
  
  // 현재 사용량 (월별 리셋)
  currentUsage: {
    students: number;              // 현재 등록된 학생 수
    teachers: number;              // 현재 등록된 선생님 수
    homeworkChecks: number;        // 이번 달 숙제 검사 횟수
    aiAnalysis: number;            // 이번 달 AI 분석 횟수
    aiGrading: number;             // 이번 달 AI 채점 횟수
    capabilityAnalysis: number;    // 이번 달 역량 분석 횟수
    conceptAnalysis: number;       // 이번 달 부족한 개념 분석 횟수
    similarProblems: number;       // 이번 달 유사문제 출제 횟수
    landingPages: number;          // 현재 생성된 랜딩페이지 수
  };
  
  // 제한 (현재 플랜 기준)
  limits: {
    maxStudents: number;
    maxTeachers: number;
    maxHomeworkChecks: number;
    maxAIAnalysis: number;
    maxAIGrading: number;
    maxCapabilityAnalysis: number;
    maxConceptAnalysis: number;
    maxSimilarProblems: number;
    maxLandingPages: number;
  };
  
  // 결제 정보
  lastPaymentAmount: number;
  lastPaymentDate: string;
  
  // 갱신 정보
  autoRenew: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  // 사용량 리셋 날짜 (매월 1일)
  lastResetDate: string;
}

// 사용량 추적
export interface UsageLog {
  id: string;
  userId: string;
  subscriptionId: string;
  
  type: 'student_add' | 'teacher_add' | 'homework_check' | 'ai_analysis' | 'ai_grading' | 'capability_analysis' | 'concept_analysis' | 'similar_problem' | 'landing_page';
  action: 'create' | 'delete' | 'use';
  
  metadata?: {
    studentId?: string;
    homeworkId?: string;
    analysisId?: string;
    problemId?: string;
    landingPageId?: string;
  };
  
  createdAt: string;
}

// 요금제 비교용 타입
export interface PlanComparison {
  feature: string;
  plans: {
    [planId: string]: string | number | boolean;
  };
}
