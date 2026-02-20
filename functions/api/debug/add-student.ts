interface Env {
  DB: D1Database;
}

// 한국 시간 생성
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/debug/add-student
 * 테스트용 학생 추가 (관리자 권한 우회)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🧪 TEST: Add student API called');

    const body: any = await context.request.json();
    const { name, email, phone, password, school, grade, academyId } = body;

    console.log('📥 TEST: Received data:', { name, email, phone, school, grade, academyId });

    // 필수 필드 검증
    if (!phone || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
          message: '연락처와 비밀번호는 필수입니다'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password too short',
          message: '비밀번호는 최소 6자 이상이어야 합니다'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 연락처 중복 확인
    const existingPhone = await DB
      .prepare('SELECT id FROM users WHERE phone = ?')
      .bind(phone)
      .first();

    if (existingPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Phone already exists',
          message: '이미 등록된 연락처입니다'
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일 중복 확인 (이메일이 제공된 경우)
    if (email) {
      const existingEmail = await DB
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(email)
        .first();

      if (existingEmail) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email already exists',
            message: '이미 등록된 이메일입니다'
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);
    const koreanTime = getKoreanTime();

    // academyId 기본값 (제공되지 않으면 1)
    const finalAcademyId = academyId || 1;

    console.log('💾 TEST: Creating student with academy_id:', finalAcademyId);

    try {
      let userId: any = null;
      let insertSuccess = false;
      let usedPattern = '';

      // 패턴 1: users + academy_id (snake_case INTEGER - 실제 DB 스키마)
      console.log('🧪 TEST: 패턴 1 시도: users + academy_id (INTEGER)');
      try {
        const userResult = await DB
          .prepare(`
            INSERT INTO users (
              email, phone, password, name, role, 
              academy_id, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            email || null,
            phone,
            hashedPassword,
            name || null,
            'STUDENT',
            finalAcademyId,
            koreanTime
          )
          .run();

        userId = userResult.meta.last_row_id;
        insertSuccess = true;
        usedPattern = 'users + academy_id';
        console.log('✅ TEST: 패턴 1 성공:', userId);
      } catch (e1: any) {
        console.log('❌ TEST: 패턴 1 실패:', e1.message);
      }

      if (!insertSuccess) {
        throw new Error('모든 INSERT 패턴 실패 - 테스트 종료');
      }

      console.log(`🎯 TEST: 사용된 패턴: ${usedPattern}`);

      // Step 2: students 테이블에 학생 레코드 생성
      let studentInsertSuccess = false;
      
      // 패턴 1: students + user_id/academy_id (snake_case - 실제 DB 스키마)
      try {
        await DB
          .prepare(`
            INSERT INTO students (
              user_id, academy_id, grade, status, created_at
            )
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(
            userId,
            finalAcademyId,
            grade || null,
            'ACTIVE',
            koreanTime
          )
          .run();
        studentInsertSuccess = true;
        console.log('✅ TEST: Student record created (snake_case)');
      } catch (e1: any) {
        console.log('⚠️ TEST: students 테이블 INSERT 실패:', e1.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: '🧪 테스트: 학생이 추가되었습니다',
          studentId: userId,
          usedPattern,
          studentTableInsert: studentInsertSuccess
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } catch (dbError: any) {
      console.error('❌ TEST: Database insert failed:', dbError);
      throw new Error(`데이터베이스 저장 실패: ${dbError.message}`);
    }

  } catch (error: any) {
    console.error('❌ TEST: Add student error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '학생 추가 중 오류가 발생했습니다',
        details: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
