// Cloudflare Pages Function - Login API with in-memory users

// 간단한 인메모리 사용자 DB (테스트용)
const USERS = [
  {
    id: 1,
    email: 'director@test.com',
    password: '3c885d8df15b3677e0210c060248e2d164e2344ebba33c332b59fbe432ca26a3', // director123
    name: '학원장',
    role: 'DIRECTOR',
    academyId: 1,
    academyName: '테스트 학원',
    academyCode: 'TEST001',
    phone: '010-1234-5678',
    approved: 1,
  },
  {
    id: 2,
    email: 'teacher@test.com',
    password: '71018b421d111c115dda462dae8141e16d8295e33a03eb721a9069aaecd417b5', // teacher123
    name: '교사',
    role: 'TEACHER',
    academyId: 1,
    academyName: '테스트 학원',
    academyCode: 'TEST001',
    phone: '010-2345-6789',
    approved: 1,
  },
  {
    id: 3,
    email: 'student@test.com',
    password: '383b69dbc40e034a627d68893440915e26239e8e2450ca3b570b0d78d9ead964', // student123
    name: '학생',
    role: 'STUDENT',
    academyId: 1,
    academyName: '테스트 학원',
    academyCode: 'TEST001',
    studentCode: 'STU001',
    className: '1반',
    phone: '010-3456-7890',
    approved: 1,
  },
  {
    id: 4,
    email: 'admin@test.com',
    password: '672c45f17aa214841a512dfc6597374ffb396f068b0f2b6744342fc234cc99f2', // admin123
    name: '관리자',
    role: 'ADMIN',
    academyId: 0,
    academyName: '시스템',
    academyCode: 'ADMIN',
    phone: '010-0000-0000',
    approved: 1,
  },
];

// SHA-256 해싱 함수
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'superplace-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function onRequestPost(context) {
  try {
    const { request } = context;

    console.log('🔐 [LOGIN API] Request received');

    const data = await request.json();
    const { email, phone, password } = data;

    const loginIdentifier = email || phone;

    console.log('📋 [LOGIN API] Login attempt:', { email, phone, loginIdentifier });

    // Validation
    if (!loginIdentifier || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일/연락처와 비밀번호를 입력해주세요',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 사용자 찾기
    const user = USERS.find(
      (u) => u.email === loginIdentifier || u.phone === loginIdentifier
    );

    if (!user) {
      console.log('❌ [LOGIN API] User not found:', loginIdentifier);
      return new Response(
        JSON.stringify({
          success: false,
          message: '이메일/연락처 또는 비밀번호가 올바르지 않습니다',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ [LOGIN API] User found:', { id: user.id, email: user.email, role: user.role });

    // 비밀번호 검증
    const hashedPassword = await hashPassword(password);
    const isValid = hashedPassword === user.password;

    console.log('🔐 [LOGIN API] Password check:', {
      provided: hashedPassword.substring(0, 10) + '...',
      stored: user.password.substring(0, 10) + '...',
      isValid
    });

    if (!isValid) {
      console.log('❌ [LOGIN API] Invalid password');
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

    // 승인 상태 확인 (학원장 제외)
    if (user.approved === 0 && user.role !== 'DIRECTOR') {
      console.log('❌ [LOGIN API] User not approved');
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

    // 토큰 생성
    const token = `${user.id}|${user.email}|${user.role}|${user.academyId || ''}|${Date.now()}`;

    console.log('✅ [LOGIN API] Login successful:', {
      userId: user.id,
      role: user.role,
      academyId: user.academyId
    });

    const response = {
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
        studentCode: user.studentCode,
        className: user.className,
      },
    };

    console.log('📤 [LOGIN API] Sending response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ [LOGIN API] Error:', error);
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
