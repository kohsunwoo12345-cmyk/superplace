import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Edge Runtime 필수 설정
export const runtime = 'edge';

// SHA-256 해시 함수 (기존 비밀번호 호환)
function hashPassword(password: string): string {
  const salt = 'superplace-salt-2024';
  return crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAcademyCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'DIRECTOR' | 'TEACHER' | 'STUDENT' | 'ADMIN';
  academyName?: string;
  academyAddress?: string;
  academyCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { email, password, name, phone, role, academyName, academyAddress, academyCode } = body;

    console.log('📝 Signup API called:', { email, name, role });

    // 유효성 검사
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        {
          success: false,
          message: '필수 정보를 모두 입력해주세요',
        },
        { status: 400 }
      );
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: '올바른 이메일 형식이 아닙니다',
        },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검사
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호는 최소 6자 이상이어야 합니다',
        },
        { status: 400 }
      );
    }

    // Role별 필수 정보 확인
    if (role === 'DIRECTOR' && !academyName) {
      return NextResponse.json(
        {
          success: false,
          message: '학원명을 입력해주세요',
        },
        { status: 400 }
      );
    }

    if ((role === 'TEACHER' || role === 'STUDENT') && !academyCode) {
      return NextResponse.json(
        {
          success: false,
          message: '학원 코드를 입력해주세요',
        },
        { status: 400 }
      );
    }

    // D1 데이터베이스 접근
    // @ts-ignore
    const env = process.env as any;
    const DB = env.DB || (globalThis as any).DB;

    if (!DB) {
      console.error('❌ D1 database not available');
      return NextResponse.json(
        {
          success: false,
          message: '데이터베이스가 연결되지 않았습니다',
        },
        { status: 500 }
      );
    }

    // 중복 이메일 확인
    const existingUser = await DB.prepare('SELECT id FROM User WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: '이미 가입된 이메일입니다',
        },
        { status: 409 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = hashPassword(password);
    let academyId: string | null = null;

    // Role별 처리
    if (role === 'DIRECTOR') {
      // 학원 생성
      academyId = generateId('academy');
      const code = generateAcademyCode();

      await DB.prepare(`
        INSERT INTO Academy (id, name, code, address, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
        .bind(academyId, academyName, code, academyAddress || '')
        .run();

      console.log('✅ Academy created:', { academyId, code });
    } else if (role === 'TEACHER' || role === 'STUDENT') {
      // 학원 코드 확인
      const academy = await DB.prepare('SELECT id FROM Academy WHERE code = ?')
        .bind(academyCode)
        .first();

      if (!academy) {
        return NextResponse.json(
          {
            success: false,
            message: '유효하지 않은 학원 코드입니다',
          },
          { status: 404 }
        );
      }

      academyId = academy.id as string;
    }

    // 사용자 생성
    const userId = generateId('user');
    const approved = role === 'DIRECTOR' ? 1 : 0; // DIRECTOR는 자동 승인

    await DB.prepare(`
      INSERT INTO User (id, email, password, name, phone, role, academyId, approved, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
      .bind(userId, email, hashedPassword, name, phone || '', role, academyId, approved)
      .run();

    console.log('✅ User created:', { userId, email, role, approved });

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: {
        userId,
        email,
        name,
        role,
        approved: approved === 1,
      },
    });
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '회원가입 중 오류가 발생했습니다',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
