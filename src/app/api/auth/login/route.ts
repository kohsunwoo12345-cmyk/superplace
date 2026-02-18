import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Password hashing function (MUST match signup - with salt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'superplace-salt-2024'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple JWT-like token generation (using | separator)
function generateToken(userId: string, email: string, role: string): string {
  return `${userId}|${email}|${role}|${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get DB from request context
    let db;
    try {
      const { env } = getRequestContext();
      db = env.DB;
    } catch (contextError: any) {
      console.error('❌ Failed to get request context:', contextError.message);
      return NextResponse.json(
        { 
          success: false, 
          message: '데이터베이스 연결 실패',
          info: 'Request context not available. Make sure D1 binding is configured in Cloudflare Pages.',
          error: contextError.message
        },
        { status: 500 }
      );
    }

    if (!db) {
      console.error('❌ DB binding not found');
      return NextResponse.json(
        { 
          success: false, 
          message: '데이터베이스가 연결되지 않았습니다',
          info: 'DB binding is not configured. Check wrangler.toml and Cloudflare Pages settings.'
        },
        { status: 500 }
      );
    }

    console.log('🔐 Login request received');

    const body = await request.json();
    const { email, password } = body;

    console.log('📋 Login data:', { email, passwordLength: password?.length });

    // Validation
    if (!email || !password) {
      console.error('❌ Missing email or password');
      return NextResponse.json(
        { success: false, message: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // Hash the provided password
    console.log('🔐 Hashing password for comparison');
    const hashedPassword = await hashPassword(password);

    // Find user by email
    console.log('🔍 Looking up user by email:', email);
    try {
      const user = await db.prepare(`
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
      `).bind(email).first();

      if (!user) {
        console.error('❌ User not found:', email);
        return NextResponse.json(
          { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다' },
          { status: 401 }
        );
      }

      console.log('✅ User found:', { id: user.id, email: user.email, role: user.role, approved: user.approved });

      // Check password
      if (user.password !== hashedPassword) {
        console.error('❌ Invalid password for:', email);

        return NextResponse.json(
          { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다' },
          { status: 401 }
        );
      }

      // Check if user is approved (except DIRECTOR who are auto-approved)
      if (user.approved === 0 && user.role !== 'DIRECTOR') {
        console.error('❌ User not approved:', email);
        return NextResponse.json(
          { success: false, message: '아직 학원장의 승인이 완료되지 않았습니다. 학원장에게 문의해주세요.' },
          { status: 403 }
        );
      }

      // Update last login time
      try {
        await db.prepare(`
          UPDATE User 
          SET lastLoginAt = datetime('now')
          WHERE id = ?
        `).bind(user.id).run();
      } catch (err) {
        console.warn('⚠️ Failed to update last login time');
      }

      // Generate token
      const token = generateToken(user.id as string, user.email as string, user.role as string);

      console.log('🎉 Login successful:', { userId: user.id, role: user.role });

      // Return user info and token
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
            phone: user.phone,
            academyId: user.academyId,
            academyName: user.academyName,
            academyCode: user.academyCode
          }
        }
      });

    } catch (error: any) {
      console.error('❌ Error finding user:', error.message);
      return NextResponse.json(
        { success: false, message: '데이터베이스 오류가 발생했습니다', info: error.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: '로그인 중 오류가 발생했습니다',
        info: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
