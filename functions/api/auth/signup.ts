// Cloudflare Pages Functions - 회원가입 API
interface Env {
  DB: D1Database;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  academyName: string;
  phone?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { name, email, password, academyName, phone }: SignupRequest =
      await context.request.json();

    // 입력 검증
    if (!name || !email || !password || !academyName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '모든 필수 항목을 입력해주세요',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 이메일 중복 체크
    const existingUser = await context.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    )
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

    // 학원 코드 생성
    const academyCode = generateAcademyCode(academyName);

    // 학원 코드 중복 체크
    const existingAcademy = await context.env.DB.prepare(
      'SELECT id FROM academy WHERE code = ?'
    )
      .bind(academyCode)
      .first();

    let finalAcademyCode = academyCode;
    if (existingAcademy) {
      // 중복되면 랜덤 숫자 추가
      finalAcademyCode = `${academyCode}${Math.floor(Math.random() * 1000)}`;
    }

    // 트랜잭션 시뮬레이션 (D1은 아직 트랜잭션 미지원)
    // 1. 학원 생성
    const academyId = `academy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await context.env.DB.prepare(
      `INSERT INTO academy (
        id, name, code, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(academyId, academyName, finalAcademyCode, 'FREE', 10, 2, 1)
      .run();

    // 2. 사용자 생성 (학원장 역할)
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = await hashPassword(password);

    await context.env.DB.prepare(
      `INSERT INTO users (
        id, email, password, name, role, phone, academyId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(userId, email, hashedPassword, name, 'OWNER', phone || '', academyId)
      .run();

    // JWT 토큰 생성
    const token = await generateToken({
      id: userId,
      email,
      name,
      role: 'OWNER',
      academyId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: '회원가입이 완료되었습니다',
        data: {
          user: {
            id: userId,
            email,
            name,
            role: 'OWNER',
            academyId,
          },
          academy: {
            id: academyId,
            name: academyName,
            code: finalAcademyCode,
          },
          token,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입 처리 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 학원 코드 생성 (한글 초성 추출)
function generateAcademyCode(academyName: string): string {
  const chosung = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  const chosungEng = [
    'G', 'GG', 'N', 'D', 'DD', 'R', 'M', 'B', 'BB',
    'S', 'SS', '', 'J', 'JJ', 'C', 'K', 'T', 'P', 'H'
  ];

  let code = '';
  for (let i = 0; i < academyName.length; i++) {
    const char = academyName[i];
    const charCode = char.charCodeAt(0);

    // 한글인 경우
    if (charCode >= 0xac00 && charCode <= 0xd7a3) {
      const index = Math.floor((charCode - 0xac00) / 588);
      code += chosungEng[index];
    }
    // 영문인 경우
    else if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
      code += char.toUpperCase();
    }
    // 숫자인 경우
    else if (charCode >= 48 && charCode <= 57) {
      code += char;
    }
  }

  return code.substring(0, 10) || 'ACADEMY';
}

// 비밀번호 해싱
async function hashPassword(password: string): Promise<string> {
  // 실제 프로덕션에서는 bcryptjs 사용
  // const bcrypt = require('bcryptjs');
  // const salt = await bcrypt.genSalt(10);
  // return await bcrypt.hash(password, salt);

  // 개발 단계: 평문 저장 (보안상 권장하지 않음)
  // 실제로는 Web Crypto API 또는 bcryptjs 사용 필요
  return password;
}

// JWT 토큰 생성
async function generateToken(payload: any): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  const signature = btoa('simple-signature');

  return `${header}.${body}.${signature}`;
}
