// Next.js API Route - Classes Management (Dev Environment)
// Supports GET, POST, PUT, DELETE with in-memory storage per academy

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for development - separated by academyId
const CLASSES_BY_ACADEMY = new Map<string, any[]>();

// Helper function to parse token and get user info
function getUserFromToken(request: NextRequest): { userId: string; email: string; role: string; academyId: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length >= 4) {
    return {
      userId: parts[0],
      email: parts[1],
      role: parts[2],
      academyId: parts[3],
    };
  }
  
  return null;
}

// Initialize default classes for a specific academy
function getDefaultClasses(): any[] {
  return [
    {
      id: '1',
      name: '초등 3학년 A반',
      grade: '초등 3학년',
      description: '기초 수학과 국어를 중점적으로 학습합니다',
      color: '#3B82F6',
      capacity: 20,
      isActive: true,
      teacherId: '2', // teacher@test.com의 userId
      students: [
        { id: '1', student: { id: '3', name: '김민수', email: 'student@test.com', studentCode: 'STU001', grade: '3학년' } },
        { id: '2', student: { id: '2', name: '이지은', email: 'jieun@example.com', studentCode: 'STU002', grade: '3학년' } },
        { id: '3', student: { id: '3', name: '박서준', email: 'seojun@example.com', studentCode: 'STU003', grade: '3학년' } },
      ],
      schedules: [
        { id: '1', subject: '수학', dayOfWeek: 1, startTime: '15:00', endTime: '16:00' },
        { id: '2', subject: '국어', dayOfWeek: 3, startTime: '15:00', endTime: '16:00' },
      ],
      _count: { students: 3 },
    },
    {
      id: '2',
      name: '초등 4학년 B반',
      grade: '초등 4학년',
      description: '영어와 수학 심화 학습',
      color: '#10B981',
      capacity: 15,
      isActive: true,
      teacherId: '2', // teacher@test.com의 userId
      students: [
        { id: '4', student: { id: '4', name: '최유진', email: 'yujin@example.com', studentCode: 'STU004', grade: '4학년' } },
        { id: '5', student: { id: '5', name: '강민호', email: 'minho@example.com', studentCode: 'STU005', grade: '4학년' } },
      ],
      schedules: [
        { id: '3', subject: '영어', dayOfWeek: 2, startTime: '16:00', endTime: '17:00' },
        { id: '4', subject: '수학', dayOfWeek: 4, startTime: '16:00', endTime: '17:00' },
      ],
      _count: { students: 2 },
    },
    {
      id: '3',
      name: '초등 5학년 특별반',
      grade: '초등 5학년',
      description: '영재 학생을 위한 심화 과정',
      color: '#8B5CF6',
      capacity: 10,
      isActive: true,
      teacherId: '2', // teacher@test.com의 userId
      students: [
        { id: '6', student: { id: '6', name: '정서연', email: 'seoyeon@example.com', studentCode: 'STU006', grade: '5학년' } },
      ],
      schedules: [
        { id: '5', subject: '과학', dayOfWeek: 1, startTime: '17:00', endTime: '18:30' },
        { id: '6', subject: '수학', dayOfWeek: 3, startTime: '17:00', endTime: '18:30' },
        { id: '7', subject: '영어', dayOfWeek: 5, startTime: '17:00', endTime: '18:30' },
      ],
      _count: { students: 1 },
    },
    {
      id: '4',
      name: '중등 1학년 A반',
      grade: '중등 1학년',
      teacherId: '2', // teacher@test.com의 userId
      description: '중학교 과정 기초 다지기',
      color: '#F59E0B',
      capacity: 25,
      isActive: true,
      students: [
        { id: '7', student: { id: '7', name: '한지우', email: 'jiwoo@example.com', studentCode: 'STU007', grade: '중1' } },
        { id: '8', student: { id: '8', name: '신동현', email: 'donghyun@example.com', studentCode: 'STU008', grade: '중1' } },
        { id: '9', student: { id: '9', name: '윤서아', email: 'seoa@example.com', studentCode: 'STU009', grade: '중1' } },
        { id: '10', student: { id: '10', name: '오준혁', email: 'junhyuk@example.com', studentCode: 'STU010', grade: '중1' } },
      ],
      schedules: [
        { id: '8', subject: '수학', dayOfWeek: 1, startTime: '19:00', endTime: '20:30' },
        { id: '9', subject: '영어', dayOfWeek: 2, startTime: '19:00', endTime: '20:30' },
        { id: '10', subject: '과학', dayOfWeek: 4, startTime: '19:00', endTime: '20:30' },
      ],
      _count: { students: 4 },
    },
    {
      id: '5',
      name: '중등 2학년 B반',
      grade: '중등 2학년',
      description: '내신 대비 집중 관리',
      color: '#EC4899',
      capacity: 20,
      isActive: true,
      teacherId: '2', // teacher@test.com의 userId
      students: [
        { id: '11', student: { id: '11', name: '임재현', email: 'jaehyun@example.com', studentCode: 'STU011', grade: '중2' } },
        { id: '12', student: { id: '12', name: '송하늘', email: 'haneul@example.com', studentCode: 'STU012', grade: '중2' } },
      ],
      schedules: [
        { id: '11', subject: '수학', dayOfWeek: 2, startTime: '20:00', endTime: '21:30' },
        { id: '12', subject: '국어', dayOfWeek: 4, startTime: '20:00', endTime: '21:30' },
      ],
      _count: { students: 2 },
    },
  ];
}

// Get or initialize classes for an academy
function getAcademyClasses(academyId: string): any[] {
  if (!CLASSES_BY_ACADEMY.has(academyId)) {
    CLASSES_BY_ACADEMY.set(academyId, getDefaultClasses());
    console.log(`🏫 [DEV CLASSES API] Initialized classes for academy: ${academyId}`);
  }
  return CLASSES_BY_ACADEMY.get(academyId)!;
}

// GET - 클래스 목록 조회 (학원별)
export async function GET(request: NextRequest) {
  console.log('📚 [DEV CLASSES API] GET - Fetching classes');

  // Try to get user from token
  const user = getUserFromToken(request);
  
  if (!user) {
    console.log('⚠️ [DEV CLASSES API] No auth token, returning demo classes for academy "1"');
    const classes = getAcademyClasses('1');
    return NextResponse.json(
      {
        success: true,
        classes: classes,
        total: classes.length,
        message: 'Classes loaded successfully (dev mode - demo academy)',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }

  console.log(`👤 [DEV CLASSES API] User: ${user.email}, Academy: ${user.academyId}, Role: ${user.role}`);

  const classes = getAcademyClasses(user.academyId);
  console.log(`📊 [DEV CLASSES API] Total classes for academy ${user.academyId}: ${classes.length}`);

  return NextResponse.json(
    {
      success: true,
      classes: classes,
      total: classes.length,
      message: `Classes loaded successfully for academy ${user.academyId}`,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

// POST - 새 클래스 생성 (학원별)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get user from token
    const user = getUserFromToken(request);
    const academyId = user?.academyId || '1'; // Fallback to demo academy
    
    console.log(`➕ [DEV CLASSES API] POST - Creating new class for academy ${academyId}:`, body.name);

    const classes = getAcademyClasses(academyId);

    const newClass = {
      id: String(Date.now()),
      ...body,
      teacherId: body.teacherId || null, // 선생님 미배정 시 null
      students: body.students || [],
      schedules: body.schedules || [],
      _count: { students: body.students?.length || 0 },
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    classes.push(newClass);

    console.log(`✅ [DEV CLASSES API] Class created: ${newClass.id}`);
    console.log(`📊 [DEV CLASSES API] Total classes for academy ${academyId}: ${classes.length}`);

    return NextResponse.json(
      {
        success: true,
        class: newClass,
        message: '클래스가 생성되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [DEV CLASSES API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '클래스 생성 실패',
      },
      { status: 500 }
    );
  }
}

// PUT - 클래스 수정 (학원별)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    // Get user from token
    const user = getUserFromToken(request);
    const academyId = user?.academyId || '1';

    console.log(`✏️ [DEV CLASSES API] PUT - Updating class ${id} for academy ${academyId}`);

    const classes = getAcademyClasses(academyId);
    const index = classes.findIndex(c => c.id === id);

    if (index === -1) {
      console.log(`❌ [DEV CLASSES API] Class not found: ${id} in academy ${academyId}`);
      return NextResponse.json(
        {
          success: false,
          message: '클래스를 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    // Update the class
    classes[index] = {
      ...classes[index],
      ...updates,
      id, // Keep original ID
    };

    console.log(`✅ [DEV CLASSES API] Class updated: ${id}`);

    return NextResponse.json({
      success: true,
      class: classes[index],
      message: '클래스가 수정되었습니다',
    });
  } catch (error) {
    console.error('❌ [DEV CLASSES API] PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '클래스 수정 실패',
      },
      { status: 500 }
    );
  }
}

// DELETE - 클래스 삭제 (학원별)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('id');

    // Get user from token
    const user = getUserFromToken(request);
    const academyId = user?.academyId || '1';

    console.log(`🗑️ [DEV CLASSES API] DELETE - Deleting class: ${classId} from academy ${academyId}`);

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message: '클래스 ID가 필요합니다',
        },
        { status: 400 }
      );
    }

    const classes = getAcademyClasses(academyId);
    const initialLength = classes.length;
    const filteredClasses = classes.filter(c => c.id !== classId);
    const deleted = filteredClasses.length < initialLength;

    if (!deleted) {
      console.log(`❌ [DEV CLASSES API] Class not found: ${classId} in academy ${academyId}`);
      return NextResponse.json(
        {
          success: false,
          message: '클래스를 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    // Update the academy's classes
    CLASSES_BY_ACADEMY.set(academyId, filteredClasses);

    console.log(`✅ [DEV CLASSES API] Class deleted: ${classId}`);
    console.log(`📊 [DEV CLASSES API] Remaining classes for academy ${academyId}: ${filteredClasses.length}`);

    return NextResponse.json({
      success: true,
      message: '클래스가 삭제되었습니다',
      remainingClasses: filteredClasses.length,
    });
  } catch (error) {
    console.error('❌ [DEV CLASSES API] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '클래스 삭제 실패',
      },
      { status: 500 }
    );
  }
}
