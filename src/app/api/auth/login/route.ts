import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  isStudentLogin?: boolean;
}

export async function POST(request: NextRequest) {
  let sql: ReturnType<typeof postgres> | null = null;

  try {
    // PostgreSQL 연결
    sql = postgres(process.env.DATABASE_URL!);
    
    const data: LoginRequest = await request.json();

    // 입력 검증 - 이메일 또는 전화번호 필요
    if ((!data.email && !data.phone) || !data.password) {
      return NextResponse.json(
        {
          success: false,
          message: '로그인 정보를 입력해주세요',
        },
        { status: 400 }
      );
    }

    // 사용자 조회 - 학생은 전화번호로, 그 외는 이메일로
    let users;
    if (data.isStudentLogin && data.phone) {
      console.log(`🔍 Student login attempt with phone: ${data.phone}`);
      users = await sql`
        SELECT * FROM users 
        WHERE phone = ${data.phone} AND role = 'STUDENT'
        LIMIT 1
      `;
    } else if (data.email) {
      console.log(`🔍 Login attempt with email: ${data.email}`);
      users = await sql`
        SELECT * FROM users 
        WHERE email = ${data.email}
        LIMIT 1
      `;
    }

    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: data.isStudentLogin
            ? '전화번호 또는 비밀번호가 올바르지 않습니다'
            : '이메일 또는 비밀번호가 올바르지 않습니다',
        },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호가 설정되지 않았습니다',
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        },
        { status: 401 }
      );
    }

    // 승인 여부 확인
    if (!user.approved) {
      return NextResponse.json(
        {
          success: false,
          message: '승인 대기 중입니다. 관리자에게 문의하세요.',
        },
        { status: 403 }
      );
    }

    // IP 주소 가져오기
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 마지막 로그인 시간 및 IP 업데이트
    await sql`
      UPDATE users 
      SET "lastLoginAt" = NOW(), "lastLoginIp" = ${ip}
      WHERE id = ${user.id}
    `;

    // 로그인 활동 로그 기록
    try {
      await sql`
        INSERT INTO activity_logs (id, "userId", action, resource, description, metadata)
        VALUES (
          gen_random_uuid(),
          ${user.id},
          'LOGIN',
          'AUTH',
          ${`${user.name || user.email}님이 로그인했습니다.`},
          ${JSON.stringify({ email: user.email, role: user.role, ip })}::jsonb
        )
      `;
    } catch (logError) {
      console.error('로그인 활동 로그 기록 실패:', logError);
      // 로그 실패해도 로그인은 계속 진행
    }

    // JWT 토큰 생성 (간단한 버전)
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      academyId: user.academy_id || user.academyid || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: '로그인 성공',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            academyId: user.academy_id || user.academyid || null,
            phone: user.phone,
            image: user.image,
          },
          token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    // 확실히 연결 종료
    if (sql) {
      try {
        await sql.end();
      } catch (e) {
        // 이미 종료된 경우 무시
      }
    }
  }
}

// JWT 토큰 생성 함수 (간단한 버전)
function generateToken(payload: any): string {
  try {
    const base64UrlEncode = (str: string): string => {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);

      let binary = '';
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }

      return Buffer.from(binary, 'binary')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64UrlEncode(
      JSON.stringify({
        ...payload,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      })
    );
    const signature = base64UrlEncode('simple-signature');

    return `${header}.${body}.${signature}`;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}
