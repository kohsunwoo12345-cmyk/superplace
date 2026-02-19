// Cloudflare Pages Function - Login API
import { compare } from 'bcrypt-ts';

interface Env {
  DB: D1Database;
}

interface LoginRequest {
  email: string;
  password: string;
}

export async function onRequestPost(context: { 
  request: Request; 
  env: Env;
}) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('🔐 Login API called');

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

    const data: LoginRequest = await request.json();
    const { email, password } = data;

    console.log('📋 Login attempt:', { email });

    // Validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일과 비밀번호를 입력해주세요',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Find user
    const user = await db
      .prepare(`
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
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User found:', { id: user.id, role: user.role, passwordLength: (user.password as string).length });

    // Verify password (supports both bcrypt and SHA-256)
    let isValid = false;
    let method = '';
    
    try {
      // Try bcrypt first
      console.log('🔐 Trying bcrypt verification...');
      isValid = await compare(password, user.password as string);
      if (isValid) {
        method = 'bcrypt';
        console.log('✅ Password verified with bcrypt');
      }
    } catch (e) {
      console.log('⚠️ Bcrypt failed, trying SHA-256...');
      // If bcrypt fails, try SHA-256 (legacy)
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'superplace-salt-2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      isValid = hashHex === user.password;
      if (isValid) {
        method = 'SHA-256';
        console.log('✅ Password verified with SHA-256');
      } else {
        console.log('❌ SHA-256 hash mismatch');
        console.log('Expected:', user.password);
        console.log('Got:', hashHex);
      }
    }

    if (!isValid) {
      console.error('❌ Invalid password');
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check approval status (except DIRECTOR)
    if (user.approved === 0 && user.role !== 'DIRECTOR') {
      return new Response(
        JSON.stringify({
          success: false,
          message: '아직 학원장의 승인이 완료되지 않았습니다.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update last login
    await db
      .prepare('UPDATE User SET lastLoginAt = datetime("now") WHERE id = ?')
      .bind(user.id)
      .run();

    // Generate token
    const token = `${user.id}|${user.email}|${user.role}|${Date.now()}`;

    console.log('✅ Login successful:', { userId: user.id, role: user.role });

    return new Response(
      JSON.stringify({
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
            academyCode: user.academyCode,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '로그인 중 오류가 발생했습니다',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
