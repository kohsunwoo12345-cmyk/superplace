import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Simple password hashing (bcrypt alternative for edge)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAcademyCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    console.log('📝 Signup request received');

    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      role, 
      academyName,
      academyAddress,
      academyCode 
    } = body;

    console.log('📋 Request data:', { email, name, role, academyName, academyAddress, academyCode });

    // Validation
    if (!email || !password || !name || !role) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { success: false, message: '필수 정보를 모두 입력해주세요' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists:', email);
    try {
      const existingUser = await db.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first();

      if (existingUser) {
        console.warn('⚠️ User already exists:', email);
        return NextResponse.json(
          { success: false, message: '이미 등록된 이메일입니다' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('❌ Error checking existing user:', error.message);
      return NextResponse.json(
        { success: false, message: '데이터베이스 오류가 발생했습니다', info: error.message },
        { status: 500 }
      );
    }

    // Hash password
    console.log('🔐 Hashing password');
    const hashedPassword = await hashPassword(password);

    let academyId: string | undefined;
    let newAcademyCode: string | undefined;

    // DIRECTOR: Create new academy
    if (role === 'DIRECTOR') {
      if (!academyName) {
        return NextResponse.json(
          { success: false, message: '학원 이름을 입력해주세요' },
          { status: 400 }
        );
      }

      if (!academyAddress) {
        return NextResponse.json(
          { success: false, message: '학원 위치를 입력해주세요' },
          { status: 400 }
        );
      }

      newAcademyCode = generateAcademyCode();
      academyId = generateId('academy');

      console.log('🏫 Creating academy:', { academyId, academyName, newAcademyCode, academyAddress });

      try {
        await db.prepare(`
          INSERT INTO academy (id, name, code, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
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
        ).run();

        console.log(`✅ Academy created: ${academyName} (${newAcademyCode})`);
      } catch (error: any) {
        console.error('❌ Failed to create academy:', error.message);
        return NextResponse.json(
          { success: false, message: '학원 생성 중 오류가 발생했습니다', info: error.message },
          { status: 500 }
        );
      }
    }

    // TEACHER or STUDENT: Find academy by code
    if (role === 'TEACHER' || role === 'STUDENT') {
      if (!academyCode) {
        console.error('❌ Academy code missing');
        return NextResponse.json(
          { success: false, message: '학원 코드를 입력해주세요' },
          { status: 400 }
        );
      }

      console.log('🔍 Looking up academy by code:', academyCode);
      try {
        const academy = await db.prepare(
          'SELECT id FROM academy WHERE code = ?'
        ).bind(academyCode).first();

        if (!academy) {
          console.error('❌ Academy not found:', academyCode);
          return NextResponse.json(
            { success: false, message: '올바른 학원 코드가 아닙니다' },
            { status: 400 }
          );
        }

        academyId = academy.id as string;
        console.log('✅ Academy found:', academyId);
      } catch (error: any) {
        console.error('❌ Error finding academy:', error.message);
        return NextResponse.json(
          { success: false, message: '학원 조회 중 오류가 발생했습니다', info: error.message },
          { status: 500 }
        );
      }
    }

    // Create user
    const userId = generateId('user');
    
    console.log('👤 Creating user:', { userId, email, name, role, academyId });

    try {
      await db.prepare(`
        INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        userId,
        email,
        hashedPassword,
        name,
        role,
        phone || '',
        academyId || null
      ).run();

      console.log(`✅ User created: ${name} (${role})`);
    } catch (error: any) {
      console.error('❌ Failed to create user:', error.message);
      return NextResponse.json(
        { success: false, message: '사용자 생성 중 오류가 발생했습니다', info: error.message },
        { status: 500 }
      );
    }

    // If STUDENT, create student record
    if (role === 'STUDENT' && academyId) {
      const studentId = generateId('student');
      console.log('👨‍🎓 Creating student record:', studentId);
      
      try {
        await db.prepare(`
          INSERT INTO students (id, userId, academyId, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          studentId,
          userId,
          academyId,
          'ACTIVE'
        ).run();
        
        console.log('✅ Student record created');
      } catch (error: any) {
        console.error('⚠️ Failed to create student record (non-fatal):', error.message);
        // Don't fail the whole signup, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다',
      user: {
        id: userId,
        email,
        name,
        role,
        academyId
      },
      ...(role === 'DIRECTOR' && newAcademyCode ? {
        academyCode: newAcademyCode
      } : {})
    });

  } catch (error: any) {
    console.error('❌ Signup error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: '회원가입 중 오류가 발생했습니다',
        info: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
