// Next.js API Route - Classes Management (Dev Environment)
// Supports GET, POST, PUT, DELETE with in-memory storage

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for development
let CLASSES_STORE = [
  {
    id: '1',
    name: '초등 3학년 A반',
    grade: '초등 3학년',
    description: '기초 수학과 국어를 중점적으로 학습합니다',
    color: '#3B82F6',
    capacity: 20,
    isActive: true,
    students: [
      { id: '1', student: { id: '1', name: '김민수', email: 'minsu@example.com', studentCode: 'STU001', grade: '3학년' } },
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

// GET - 클래스 목록 조회
export async function GET(request: NextRequest) {
  console.log('📚 [DEV CLASSES API] GET - Fetching all classes');
  console.log(`📊 [DEV CLASSES API] Total classes in store: ${CLASSES_STORE.length}`);

  return NextResponse.json(
    {
      success: true,
      classes: CLASSES_STORE,
      total: CLASSES_STORE.length,
      message: 'Classes loaded successfully (dev mode)',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

// POST - 새 클래스 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('➕ [DEV CLASSES API] POST - Creating new class:', body);

    const newClass = {
      id: String(Date.now()),
      ...body,
      students: body.students || [],
      schedules: body.schedules || [],
      _count: { students: body.students?.length || 0 },
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    CLASSES_STORE.push(newClass);

    console.log('✅ [DEV CLASSES API] Class created:', newClass.id);
    console.log(`📊 [DEV CLASSES API] Total classes: ${CLASSES_STORE.length}`);

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

// PUT - 클래스 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    console.log(`✏️ [DEV CLASSES API] PUT - Updating class ${id}:`, updates);

    const index = CLASSES_STORE.findIndex(c => c.id === id);

    if (index === -1) {
      console.log(`❌ [DEV CLASSES API] Class not found: ${id}`);
      return NextResponse.json(
        {
          success: false,
          message: '클래스를 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    // Update the class
    CLASSES_STORE[index] = {
      ...CLASSES_STORE[index],
      ...updates,
      id, // Keep original ID
    };

    console.log('✅ [DEV CLASSES API] Class updated:', id);

    return NextResponse.json(
      {
        success: true,
        class: CLASSES_STORE[index],
        message: '클래스가 수정되었습니다',
      },
      { status: 200 }
    );
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

// DELETE - 클래스 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('id');

    console.log(`🗑️ [DEV CLASSES API] DELETE - Deleting class: ${classId}`);

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message: '클래스 ID가 필요합니다',
        },
        { status: 400 }
      );
    }

    const initialLength = CLASSES_STORE.length;
    CLASSES_STORE = CLASSES_STORE.filter(c => c.id !== classId);
    const deleted = CLASSES_STORE.length < initialLength;

    if (!deleted) {
      console.log(`❌ [DEV CLASSES API] Class not found: ${classId}`);
      return NextResponse.json(
        {
          success: false,
          message: '클래스를 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    console.log(`✅ [DEV CLASSES API] Class deleted: ${classId}`);
    console.log(`📊 [DEV CLASSES API] Remaining classes: ${CLASSES_STORE.length}`);

    return NextResponse.json(
      {
        success: true,
        message: '클래스가 삭제되었습니다',
        remainingClasses: CLASSES_STORE.length,
      },
      { status: 200 }
    );
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
