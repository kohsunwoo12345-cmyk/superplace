import { NextRequest, NextResponse } from 'next/server';

// Edge Runtime 필수 설정
export const runtime = 'edge';

// SHA-256 해시 함수 (Web Crypto API 사용)
async function hashPassword(password: string): Promise<string> {
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login API called:', { email });

    // 유효성 검사
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: '이메일과 비밀번호를 입력해주세요',
        },
        { status: 400 }
      );
    }

    // D1 데이터베이스 접근 (Cloudflare Workers 환경)
    // @ts-ignore - Cloudflare Workers 환경
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

    // 비밀번호 해시
    const hashedPassword = await hashPassword(password);
    console.log('🔑 Hashed password for:', email);

    // 사용자 조회
    const user = await DB.prepare(`
      SELECT 
        u.id,
        u.email,
        u.password,
        u.name,
        u.role,
        u.phone,
        u.academyId,
        u.approved,
        a.name as academyName,
        a.code as academyCode
      FROM User u
      LEFT JOIN Academy a ON u.academyId = a.id
      WHERE u.email = ?
    `)
      .bind(email)
      .first();

    if (!user) {
      console.error('❌ User not found:', email);
      return NextResponse.json(
        {
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        },
        { status: 401 }
      );
    }

    console.log('✅ User found:', { id: user.id, role: user.role, approved: user.approved });

    // 비밀번호 확인
    if (user.password !== hashedPassword) {
      console.error('❌ Invalid password');
      return NextResponse.json(
        {
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        },
        { status: 401 }
      );
    }

    // 승인 상태 확인 (DIRECTOR 제외)
    if (user.approved === 0 && user.role !== 'DIRECTOR') {
      return NextResponse.json(
        {
          success: false,
          message: '아직 학원장의 승인이 완료되지 않았습니다.',
        },
        { status: 403 }
      );
    }

    // 마지막 로그인 시간 업데이트
    await DB.prepare('UPDATE User SET lastLoginAt = datetime("now") WHERE id = ?')
      .bind(user.id)
      .run();

    // 토큰 생성
    const token = `${user.id}|${user.email}|${user.role}|${Date.now()}`;

    console.log('✅ Login successful:', { userId: user.id, role: user.role });

    return NextResponse.json({
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
      },
    });
  } catch (error: any) {
    console.error('❌ Login error:', error);
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
