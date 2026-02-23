import { NextRequest, NextResponse } from 'next/server';

// 개발 환경용 - 간단한 목업 사용자
const DEV_USERS = [
  {
    id: 1,
    email: 'director@test.com',
    password: 'director123',
    name: '학원장',
    role: 'DIRECTOR',
    academyId: 1,
    academyName: '테스트 학원',
    academyCode: 'TEST001',
    phone: '010-1234-5678',
  },
  {
    id: 2,
    email: 'teacher@test.com',
    password: 'teacher123',
    name: '교사',
    role: 'TEACHER',
    academyId: 1,
    academyName: '테스트 학원',
    academyCode: 'TEST001',
    phone: '010-2345-6789',
  },
  {
    id: 3,
    email: 'student@test.com',
    password: 'student123',
    name: '학생',
    role: 'STUDENT',
    academyId: 1,
    academyName: '테스트 학원',
    academyCode: 'TEST001',
    studentCode: 'STU001',
    className: '1반',
    phone: '010-3456-7890',
  },
  {
    id: 4,
    email: 'admin@test.com',
    password: 'admin123',
    name: '관리자',
    role: 'ADMIN',
    academyId: 0,
    academyName: '시스템',
    academyCode: 'ADMIN',
    phone: '010-0000-0000',
  },
];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [DEV LOGIN API] Request received');

    const body = await request.json();
    const { email, phone, password } = body;

    const loginIdentifier = email || phone;

    console.log('📋 [DEV LOGIN API] Login attempt:', { email, phone });

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: '이메일/연락처와 비밀번호를 입력해주세요',
        },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = DEV_USERS.find(
      (u) => (u.email === loginIdentifier || u.phone === loginIdentifier) && u.password === password
    );

    if (!user) {
      console.log('❌ [DEV LOGIN API] User not found or wrong password');
      return NextResponse.json(
        {
          success: false,
          message: '이메일/연락처 또는 비밀번호가 올바르지 않습니다',
        },
        { status: 401 }
      );
    }

    console.log('✅ [DEV LOGIN API] Login successful:', { id: user.id, role: user.role });

    const token = `${user.id}|${user.email}|${user.role}|${user.academyId || ''}|${Date.now()}`;

    return NextResponse.json(
      {
        success: true,
        message: '로그인 성공',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          academyId: user.academyId,
          academyName: user.academyName,
          academyCode: user.academyCode,
          studentCode: user.studentCode,
          className: user.className,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ [DEV LOGIN API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '로그인 중 오류가 발생했습니다',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
