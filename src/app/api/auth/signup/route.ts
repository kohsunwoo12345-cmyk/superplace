import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'DIRECTOR' | 'TEACHER' | 'STUDENT';
  academyName?: string; // DIRECTOR만
  academyCode?: string; // TEACHER, STUDENT만
}

export async function POST(request: NextRequest) {
  let sql: ReturnType<typeof postgres> | null = null;

  try {
    // PostgreSQL 연결
    sql = postgres(process.env.DATABASE_URL!);
    
    const data: SignupRequest = await request.json();

    // 입력 검증
    if (!data.email || !data.password || !data.name || !data.role) {
      return NextResponse.json(
        {
          success: false,
          message: '필수 정보를 모두 입력해주세요',
        },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (data.password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호는 최소 8자 이상이어야 합니다',
        },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${data.email} LIMIT 1
    `;

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: '이미 사용 중인 이메일입니다',
        },
        { status: 409 }
      );
    }

    // 역할별 검증
    if (data.role === 'DIRECTOR' && !data.academyName) {
      return NextResponse.json(
        {
          success: false,
          message: '학원 이름을 입력해주세요',
        },
        { status: 400 }
      );
    }

    if ((data.role === 'TEACHER' || data.role === 'STUDENT') && !data.academyCode) {
      return NextResponse.json(
        {
          success: false,
          message: '학원 코드를 입력해주세요',
        },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(data.password, 10);

    let academyId: string | null = null;

    // DIRECTOR - 학원 자동 생성
    if (data.role === 'DIRECTOR' && data.academyName) {
      const studentInviteCode = generateInviteCode();
      const teacherInviteCode = generateInviteCode();
      
      const academies = await sql`
        INSERT INTO academies (id, name, plan, "maxStudents", "maxTeachers", "studentInviteCode", "teacherInviteCode")
        VALUES (gen_random_uuid(), ${data.academyName}, 'FREE', 30, 5, ${studentInviteCode}, ${teacherInviteCode})
        RETURNING id
      `;
      
      if (academies && academies.length > 0) {
        academyId = academies[0].id;
      }
    }

    // TEACHER, STUDENT - 학원 코드로 학원 찾기
    if ((data.role === 'TEACHER' || data.role === 'STUDENT') && data.academyCode) {
      const academies = await sql`
        SELECT * FROM academies 
        WHERE "studentInviteCode" = ${data.academyCode} OR "teacherInviteCode" = ${data.academyCode}
        LIMIT 1
      `;

      if (!academies || academies.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: '유효하지 않은 학원 코드입니다',
          },
          { status: 404 }
        );
      }

      const academy = academies[0];

      // 학원 코드 유형 검증
      if (data.role === 'TEACHER' && academy.teacherInviteCode !== data.academyCode) {
        return NextResponse.json(
          {
            success: false,
            message: '선생님 초대 코드가 아닙니다',
          },
          { status: 403 }
        );
      }

      if (data.role === 'STUDENT' && academy.studentInviteCode !== data.academyCode) {
        return NextResponse.json(
          {
            success: false,
            message: '학생 초대 코드가 아닙니다',
          },
          { status: 403 }
        );
      }

      academyId = academy.id;
    }

    // 사용자 생성
    const approved = data.role === 'DIRECTOR';
    const emailVerified = data.role === 'DIRECTOR' ? 'NOW()' : 'NULL';
    
    const users = await sql`
      INSERT INTO users (
        id, email, password, name, phone, role, "academyId", approved, "emailVerified"
      )
      VALUES (
        gen_random_uuid(),
        ${data.email},
        ${hashedPassword},
        ${data.name},
        ${data.phone || null},
        ${data.role},
        ${academyId},
        ${approved},
        ${data.role === 'DIRECTOR' ? sql`NOW()` : null}
      )
      RETURNING id, email, name, role, approved
    `;

    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: '사용자 생성 실패',
        },
        { status: 500 }
      );
    }

    // 활동 로그 기록
    try {
      await sql`
        INSERT INTO activity_logs (id, "userId", action, resource, description, metadata)
        VALUES (
          gen_random_uuid(),
          ${user.id},
          'CREATE',
          'USER',
          ${`${user.name}님이 회원가입했습니다. (${data.role})`},
          ${JSON.stringify({ email: user.email, role: user.role, academyId })}::jsonb
        )
      `;
    } catch (logError) {
      console.error('회원가입 활동 로그 기록 실패:', logError);
      // 로그 실패해도 회원가입은 계속 진행
    }

    return NextResponse.json(
      {
        success: true,
        message:
          data.role === 'DIRECTOR'
            ? '회원가입이 완료되었습니다. 로그인해주세요.'
            : '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            approved: user.approved,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    return NextResponse.json(
      {
        success: false,
        message: '회원가입 처리 중 오류가 발생했습니다',
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

// 초대 코드 생성 함수
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
