import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { compare } from 'bcrypt-ts';

export const runtime = 'edge';

// Check if password matches - supports both bcrypt and SHA-256 hashes
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2y$')) {
    // Use bcrypt-ts for bcrypt hashes (compatible with edge runtime)
    return await compare(plainPassword, hashedPassword);
  }
  
  // For SHA-256 hashes (new format), verify directly
  const encoder = new TextEncoder();
  const data = encoder.encode(plainPassword + 'superplace-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === hashedPassword;
}

// Simple JWT-like token generation (using | separator)
function generateToken(userId: string, email: string, role: string): string {
  return `${userId}|${email}|${role}|${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called');
    
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
              contextError: contextError.message
            }
          },
          { status: 500 }
        );
      }
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

      console.log('✅ User found:', { id: user.id, email: user.email, role: user.role, approved: user.approved, passwordType: user.password?.substring(0, 4) });

      // Check password - handle both bcrypt and SHA-256 hashes
      const isPasswordValid = await verifyPassword(password, user.password as string);

      if (!isPasswordValid) {
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
