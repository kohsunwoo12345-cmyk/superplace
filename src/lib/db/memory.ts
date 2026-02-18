// =============================================
// In-Memory Database for Edge Runtime
// 프로덕션에서는 Cloudflare D1로 교체
// =============================================

export interface Academy {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  subscriptionPlan: string;
  maxStudents: number;
  maxTeachers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  academyId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId: string;
  academyId: string;
  grade?: string;
  parentPhone?: string;
  parentEmail?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  academyId: string;
  teacherId?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIBot {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  price: number;
  category?: string;
  tags?: string[];
  iconUrl?: string;
  isActive: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotAssignment {
  id: string;
  botId: string;
  studentId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface PaymentApproval {
  id: string;
  academyId: string;
  planId: string;
  amount: number;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface SMSTemplate {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// In-Memory Database
// =============================================

class InMemoryDatabase {
  academies: Academy[] = [];
  users: User[] = [];
  students: Student[] = [];
  classes: Class[] = [];
  pricingPlans: PricingPlan[] = [];
  aiBots: AIBot[] = [];
  botAssignments: BotAssignment[] = [];
  paymentApprovals: PaymentApproval[] = [];
  smsTemplates: SMSTemplate[] = [];

  constructor() {
    this.initializeTestData();
  }

  private initializeTestData() {
    const now = new Date().toISOString();

    // Academy
    this.academies = [
      {
        id: 'academy-test-001',
        name: '슈퍼플레이스 테스트 학원',
        code: 'SUPERTEST01',
        description: '완전한 기능 테스트를 위한 학원',
        address: '인천광역시 서구 청라커낼로 270, 2층',
        phone: '010-8739-9697',
        email: 'test@superplace.com',
        subscriptionPlan: 'PREMIUM',
        maxStudents: 100,
        maxTeachers: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Users
    this.users = [
      {
        id: 'user-admin-001',
        email: 'admin@superplace.com',
        password: 'admin1234',
        name: '슈퍼 관리자',
        role: 'SUPER_ADMIN',
        phone: '010-1234-5678',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-director-001',
        email: 'director@superplace.com',
        password: 'director1234',
        name: '원장 선생님',
        role: 'DIRECTOR',
        phone: '010-2345-6789',
        academyId: 'academy-test-001',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-teacher-001',
        email: 'teacher@superplace.com',
        password: 'teacher1234',
        name: '김강사',
        role: 'TEACHER',
        phone: '010-3456-7890',
        academyId: 'academy-test-001',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Students (10명)
    for (let i = 1; i <= 10; i++) {
      const studentId = `user-student-${String(i).padStart(3, '0')}`;
      this.users.push({
        id: studentId,
        email: `student${i}@test.com`,
        password: 'student1234',
        name: `학생${i}`,
        role: 'STUDENT',
        phone: `010-${String(i).repeat(4)}-${String(i).repeat(4)}`,
        academyId: 'academy-test-001',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      this.students.push({
        id: `student-${String(i).padStart(3, '0')}`,
        userId: studentId,
        academyId: 'academy-test-001',
        grade: i <= 3 ? `중${i}` : i <= 6 ? `고${i - 3}` : `중${i - 6}`,
        parentPhone: `010-${String(i).repeat(4)}-000${i}`,
        parentEmail: `parent${i}@test.com`,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Classes
    this.classes = [
      {
        id: 'class-001',
        name: '중등 수학 A반',
        description: '중학교 1-2학년 수학',
        academyId: 'academy-test-001',
        teacherId: 'user-teacher-001',
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'class-002',
        name: '중등 수학 B반',
        description: '중학교 3학년 수학',
        academyId: 'academy-test-001',
        teacherId: 'user-teacher-001',
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'class-003',
        name: '고등 수학 A반',
        description: '고등학교 1-2학년 수학',
        academyId: 'academy-test-001',
        teacherId: 'user-teacher-001',
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Pricing Plans
    this.pricingPlans = [
      {
        id: 'plan-free',
        name: 'FREE',
        price: 0,
        duration: 30,
        maxStudents: 10,
        maxTeachers: 2,
        features: ['기본 기능', '10명 학생', '2명 강사'],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan-basic',
        name: 'BASIC',
        price: 50000,
        duration: 30,
        maxStudents: 30,
        maxTeachers: 5,
        features: ['모든 기능', '30명 학생', '5명 강사', 'AI 챗봇'],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan-premium',
        name: 'PREMIUM',
        price: 100000,
        duration: 30,
        maxStudents: 100,
        maxTeachers: 10,
        features: ['모든 기능', '100명 학생', '10명 강사', 'AI 챗봇', '우선 지원'],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // AI Bots (쇼핑몰 제품)
    this.aiBots = [
      {
        id: 'bot-001',
        name: '수학 과외 선생님',
        description: '수학 문제를 풀어주고 설명해주는 AI',
        systemPrompt: '당신은 친절한 수학 선생님입니다. 학생의 질문에 쉽게 설명해주세요.',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        price: 10000,
        category: 'MATH',
        tags: ['수학', '과외', '교육'],
        isActive: true,
        usageCount: 0,
        createdBy: 'user-admin-001',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bot-002',
        name: '영어 회화 선생님',
        description: '영어 회화를 연습할 수 있는 AI',
        systemPrompt: '당신은 원어민 영어 선생님입니다. 학생과 자연스러운 대화를 나누세요.',
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 1000,
        price: 15000,
        category: 'ENGLISH',
        tags: ['영어', '회화', '교육'],
        isActive: true,
        usageCount: 0,
        createdBy: 'user-admin-001',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bot-003',
        name: '과학 실험 도우미',
        description: '과학 실험을 도와주는 AI',
        systemPrompt: '당신은 과학 실험을 도와주는 조교입니다. 안전하고 재미있게 설명하세요.',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        price: 12000,
        category: 'SCIENCE',
        tags: ['과학', '실험', '교육'],
        isActive: true,
        usageCount: 0,
        createdBy: 'user-admin-001',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bot-004',
        name: '역사 스토리텔러',
        description: '역사를 재미있게 들려주는 AI',
        systemPrompt: '당신은 역사를 이야기로 들려주는 선생님입니다.',
        model: 'gpt-4',
        temperature: 0.9,
        maxTokens: 1500,
        price: 8000,
        category: 'HISTORY',
        tags: ['역사', '스토리', '교육'],
        isActive: true,
        usageCount: 0,
        createdBy: 'user-admin-001',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bot-005',
        name: '코딩 튜터',
        description: '프로그래밍을 가르쳐주는 AI',
        systemPrompt: '당신은 프로그래밍을 가르치는 선생님입니다.',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        price: 20000,
        category: 'CODING',
        tags: ['코딩', '프로그래밍', '교육'],
        isActive: true,
        usageCount: 0,
        createdBy: 'user-admin-001',
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Bot Assignments
    this.botAssignments = [
      {
        id: 'ba-001',
        botId: 'bot-001',
        studentId: 'student-001',
        assignedBy: 'user-director-001',
        assignedAt: now,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        id: 'ba-002',
        botId: 'bot-001',
        studentId: 'student-002',
        assignedBy: 'user-director-001',
        assignedAt: now,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        id: 'ba-003',
        botId: 'bot-002',
        studentId: 'student-003',
        assignedBy: 'user-director-001',
        assignedAt: now,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
    ];

    // Payment Approvals
    this.paymentApprovals = [
      {
        id: 'payment-001',
        academyId: 'academy-test-001',
        planId: 'plan-premium',
        amount: 100000,
        status: 'PENDING',
        requestedAt: now,
      },
    ];

    // SMS Templates
    this.smsTemplates = [
      {
        id: 'sms-template-001',
        title: '출석 알림',
        content: '[슈퍼플레이스] {학생명}님이 {시간}에 출석하였습니다.',
        createdBy: 'user-admin-001',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sms-template-002',
        title: '숙제 알림',
        content: '[슈퍼플레이스] {과목} 숙제 마감일이 {날짜}입니다.',
        createdBy: 'user-admin-001',
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  // Helper methods
  findUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findStudentsByAcademyId(academyId: string): Student[] {
    return this.students.filter((s) => s.academyId === academyId);
  }

  findClassesByAcademyId(academyId: string): Class[] {
    return this.classes.filter((c) => c.academyId === academyId);
  }

  findAIBotsByCategory(category?: string): AIBot[] {
    if (!category) return this.aiBots.filter((b) => b.isActive);
    return this.aiBots.filter((b) => b.isActive && b.category === category);
  }

  findBotAssignmentsByStudentId(studentId: string): BotAssignment[] {
    return this.botAssignments.filter(
      (ba) => ba.studentId === studentId && ba.isActive
    );
  }

  getStats() {
    return {
      totalUsers: this.users.length,
      totalStudents: this.students.length,
      totalClasses: this.classes.length,
      totalAIBots: this.aiBots.length,
      totalBotAssignments: this.botAssignments.length,
      totalPaymentApprovals: this.paymentApprovals.length,
      totalSMSTemplates: this.smsTemplates.length,
    };
  }
}

// Singleton instance
export const db = new InMemoryDatabase();
