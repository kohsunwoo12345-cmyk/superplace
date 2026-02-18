// Cloudflare Pages Function - Signup API
import { hash } from 'bcrypt-ts';

interface Env {
  DB: D1Database;
}

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'DIRECTOR' | 'TEACHER' | 'STUDENT';
  academyName?: string;
  academyAddress?: string;
  academyCode?: string;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAcademyCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

export async function onRequestPost(context: { 
  request: Request; 
  env: Env;
}) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Signup API called');

    if (!db) {
      console.error('❌ DB binding not found');
      return new Response(
        JSON.stringify({
          success: false,
          message: '데이터베이스가 연결되지 않았습니다',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data: SignupRequest = await request.json();
    const { email, password, name, phone, role, academyName, academyAddress, academyCode } = data;

    console.log('📋 Signup request:', { email, name, role });

    // Validation
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '필수 정보를 모두 입력해주세요',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '올바른 이메일 형식이 아닙니다',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Password length validation
    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '비밀번호는 최소 8자 이상이어야 합니다',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for existing user
    const existingUser = await db
      .prepare('SELECT id FROM User WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이미 사용 중인 이메일입니다',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);
    const userId = generateId('user');
    let academyId: string | undefined;
    let newAcademyCode: string | undefined;

    // DIRECTOR: Create academy
    if (role === 'DIRECTOR') {
      if (!academyName) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '학원 이름을 입력해주세요',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (!academyAddress) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '학원 위치를 입력해주세요',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      academyId = generateId('academy');
      newAcademyCode = generateAcademyCode();

      console.log('🏫 Creating academy:', { academyId, academyName, newAcademyCode });

      await db
        .prepare(`
          INSERT INTO Academy (id, name, code, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `)
        .bind(
          academyId,
          academyName,
          newAcademyCode,
          academyAddress,
          phone || '',
          email,
          'FREE',
          10,
          2,
          1
        )
        .run();

      console.log('✅ Academy created');
    }

    // TEACHER or STUDENT: Find academy
    if (role === 'TEACHER' || role === 'STUDENT') {
      if (!academyCode) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '학원 코드를 입력해주세요',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const academy = await db
        .prepare('SELECT id FROM Academy WHERE code = ?')
        .bind(academyCode)
        .first();

      if (!academy) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '올바른 학원 코드가 아닙니다',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      academyId = academy.id as string;
      console.log('✅ Academy found:', academyId);
    }

    // Create user
    await db
      .prepare(`
        INSERT INTO User (id, email, password, name, role, phone, academyId, approved, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(
        userId,
        email,
        hashedPassword,
        name,
        role,
        phone || '',
        academyId || null,
        role === 'DIRECTOR' ? 1 : 0
      )
      .run();

    console.log('✅ User created:', { userId, email, role });

    return new Response(
      JSON.stringify({
        success: true,
        message: '회원가입이 완료되었습니다',
        user: {
          id: userId,
          email,
          name,
          role,
          academyId,
        },
        ...(role === 'DIRECTOR' && newAcademyCode
          ? { academyCode: newAcademyCode }
          : {}),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입 중 오류가 발생했습니다',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
