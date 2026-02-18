import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { hash } from 'bcrypt-ts';

export const runtime = 'edge';

// Simple password hashing using bcrypt (compatible with existing users)
async function hashPassword(password: string): Promise<string> {
  // Use bcrypt with cost factor 10 (same as bcryptjs default)
  return await hash(password, 10);
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAcademyCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Signup API called');
    
    // Get DB from request context with better error handling
    let db;
    let context;
    
    try {
      // Try to get context
      context = getRequestContext();
      if (!context || !context.env) {
        throw new Error('Context or env is undefined');
      }
      db = context.env.DB;
      console.log('✅ Got DB from context');
    } catch (contextError: any) {
      console.error('❌ getRequestContext failed:', contextError);
      
      // Fallback: try to get from request directly (Cloudflare Workers style)
      try {
        // @ts-ignore - Cloudflare Workers binding
        db = request.env?.DB;
        if (db) {
          console.log('✅ Got DB from request.env (fallback)');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      if (!db) {
        return NextResponse.json(
          { 
            success: false, 
            message: '서버 설정 오류입니다. Cloudflare Pages 대시보드에서 D1 바인딩을 확인해주세요.',
            info: 'D1 binding not accessible',
            debug: {
              contextError: contextError.message,
              hasRequest: !!request,
              requestKeys: request ? Object.keys(request) : []
            }
          },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    console.log('📋 Request body:', { ...body, password: '***' });

    console.log('📝 Signup request received');

    // Note: Tables should already exist in D1 database
    // No need to create tables on every signup request

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
        'SELECT id FROM User WHERE email = ?'
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
          INSERT INTO Academy (id, name, code, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
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
          'SELECT id FROM Academy WHERE code = ?'
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
        INSERT INTO User (id, email, password, name, role, phone, academyId, approved, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        userId,
        email,
        hashedPassword,
        name,
        role,
        phone || '',
        academyId || null,
        role === 'DIRECTOR' ? 1 : 0  // Directors are auto-approved
      ).run();

      console.log(`✅ User created: ${name} (${role})`);
    } catch (error: any) {
      console.error('❌ Failed to create user:', error.message);
      return NextResponse.json(
        { success: false, message: '사용자 생성 중 오류가 발생했습니다', info: error.message },
        { status: 500 }
      );
    }

    console.log('🎉 Signup completed successfully');

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
