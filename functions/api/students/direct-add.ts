interface Env {
  DB: D1Database;
}

/**
 * POST /api/students/direct-add
 * 직접 학생 추가 테스트 - 모든 에러를 캐치하고 로깅
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const logs: string[] = [];
  
  try {
    const { DB } = context.env;
    logs.push('✅ DB 연결 확인');

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured", logs }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 요청 본문 파싱
    const body = await context.request.json();
    logs.push(`✅ 요청 데이터: ${JSON.stringify(body)}`);

    const { name, phone, academyId } = body;

    // 필수 필드 검증
    if (!name || !phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '이름과 연락처는 필수입니다',
          logs 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authorization 헤더에서 사용자 정보 추출
    const authHeader = context.request.headers.get('Authorization');
    let tokenAcademyId = academyId;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const parts = token.split('|');
      if (parts.length >= 4) {
        tokenAcademyId = parts[3] || academyId; // 토큰에서 academyId 추출
        logs.push(`✅ 토큰에서 academyId 추출: ${tokenAcademyId}`);
      }
    }

    // 1. User 테이블 스키마 확인
    try {
      const schema = await DB.prepare('PRAGMA table_info(User)').all();
      logs.push(`✅ User 테이블 컬럼: ${JSON.stringify(schema.results?.map((r: any) => r.name))}`);
    } catch (e: any) {
      logs.push(`❌ 스키마 조회 실패: ${e.message}`);
    }

    // 2. 임시 이메일 생성 (전화번호 기반)
    const tempEmail = `student_${phone}@temp.superplace.local`;
    logs.push(`✅ 임시 이메일 생성: ${tempEmail}`);

    // 3. 임시 비밀번호 생성 (전화번호 뒷자리)
    const tempPassword = phone.slice(-6);
    logs.push(`✅ 임시 비밀번호 생성: ${tempPassword}`);

    // 4. Student ID 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const studentId = `student-${timestamp}-${randomStr}`;
    logs.push(`✅ Student ID 생성: ${studentId}`);

    // 5. User 테이블에 삽입
    let insertSuccess = false;

    try {
      logs.push('🔄 User 테이블에 삽입 시도...');
      await DB.prepare(`
        INSERT INTO User (id, email, name, phone, role, academyId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 'STUDENT', ?, datetime('now'), datetime('now'))
      `).bind(studentId, tempEmail, name, phone, tokenAcademyId).run();
      
      insertSuccess = true;
      logs.push(`✅ User 테이블 삽입 성공!`);
    } catch (e: any) {
      logs.push(`❌ User 테이블 삽입 실패: ${e.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User 테이블 삽입 실패',
          message: e.message,
          logs 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!insertSuccess) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '학생 생성 실패',
          logs 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. students 테이블 스키마 확인
    try {
      const schema = await DB.prepare('PRAGMA table_info(students)').all();
      logs.push(`✅ students 테이블 컬럼: ${JSON.stringify(schema.results?.map((r: any) => r.name))}`);
    } catch (e: any) {
      logs.push(`❌ students 스키마 조회 실패: ${e.message}`);
    }

    // 5. students 테이블에 삽입 시도 (여러 패턴)
    let studentInsertSuccess = false;

    // 패턴 1: camelCase
    try {
      logs.push('🔄 students 시도 1: camelCase (userId, academyId)');
      await DB.prepare(`
        INSERT INTO students (userId, academyId, grade, status, createdAt)
        VALUES (?, ?, NULL, 'ACTIVE', datetime('now'))
      `).bind(userId, academyId).run();
      
      studentInsertSuccess = true;
      logs.push('✅ students 패턴 1 성공!');
    } catch (e: any) {
      logs.push(`❌ students 패턴 1 실패: ${e.message}`);
      
      // 패턴 2: snake_case
      try {
        logs.push('🔄 students 시도 2: snake_case (user_id, academy_id)');
        await DB.prepare(`
          INSERT INTO students (user_id, academy_id, grade, status, created_at)
          VALUES (?, ?, NULL, 'ACTIVE', datetime('now'))
        `).bind(userId, academyId).run();
        
        studentInsertSuccess = true;
        logs.push('✅ students 패턴 2 성공!');
      } catch (e2: any) {
        logs.push(`❌ students 패턴 2 실패: ${e2.message}`);
        
        // 패턴 3: 최소 필드
        try {
          logs.push('🔄 students 시도 3: 최소 필드');
          await DB.prepare(`
            INSERT INTO students (userId, academyId)
            VALUES (?, ?)
          `).bind(userId, academyId).run();
          
          studentInsertSuccess = true;
          logs.push('✅ students 패턴 3 성공!');
        } catch (e3: any) {
          logs.push(`❌ students 패턴 3 실패: ${e3.message}`);
        }
      }
    }

    // 6. 생성된 학생 정보 조회
    const createdStudent = await DB.prepare('SELECT * FROM User WHERE id = ?').bind(studentId).first();
    logs.push(`✅ 생성된 학생: ${JSON.stringify(createdStudent)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '학생 추가 성공!',
        student: {
          id: studentId,
          name: name,
          email: tempEmail,
          phone: phone,
          role: 'STUDENT',
          academyId: tokenAcademyId,
          password: tempPassword
        },
        logs
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    logs.push(`❌ 전체 에러: ${error.message}`);
    logs.push(`❌ 스택: ${error.stack}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        logs
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
