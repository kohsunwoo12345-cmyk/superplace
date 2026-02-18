import { NextRequest, NextResponse } from 'next/server';

// 테스트 계정 (하드코딩)
const testUsers = [
  {
    id: '1',
    email: 'admin@superplace.com',
    password: 'admin1234',
    name: '슈퍼플레이스 관리자',
    role: 'SUPER_ADMIN',
    academy_id: null,
  },
  {
    id: '2',
    email: 'director@superplace.com',
    password: 'director1234',
    name: '원장',
    role: 'DIRECTOR',
    academy_id: null,
  },
  {
    id: '3',
    email: 'teacher@superplace.com',
    password: 'teacher1234',
    name: '김선생',
    role: 'TEACHER',
    academy_id: null,
  },
  {
    id: '4',
    email: 'test@test.com',
    password: 'test1234',
    name: '테스트',
    role: 'ADMIN',
    academy_id: null,
  },
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 로그인 시도:', { email, passwordLength: password?.length });

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: '이메일과 비밀번호를 입력해주세요',
        },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = testUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        },
        { status: 401 }
      );
    }

    // 간단한 토큰 생성
    const token = `${user.id}.${user.email}.${user.role}.${Date.now()}`;
    
    console.log('✅ 로그인 성공:', { userId: user.id, role: user.role });

    return NextResponse.json({
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          academy_id: user.academy_id,
        },
      },
    });
  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '로그인 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json({
    success: true,
    message: '로그아웃 성공',
  });
}
