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

    const { name, email, phone, password, academyId } = body;

    // 1. users 테이블 스키마 확인
    try {
      const schema = await DB.prepare('PRAGMA table_info(users)').all();
      logs.push(`✅ users 테이블 컬럼: ${JSON.stringify(schema.results?.map((r: any) => r.name))}`);
    } catch (e: any) {
      logs.push(`❌ 스키마 조회 실패: ${e.message}`);
    }

    // 2. 비밀번호 해싱
    const salt = 'superplace-salt-2024';
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    logs.push('✅ 비밀번호 해싱 완료');

    // 3. users 테이블에 삽입 시도 (여러 패턴 시도)
    let userId: any = null;
    let insertSuccess = false;

    // 패턴 1: camelCase 시도
    try {
      logs.push('🔄 시도 1: camelCase (academyId, createdAt)');
      const result = await DB.prepare(`
        INSERT INTO users (email, phone, password, name, role, academyId, createdAt)
        VALUES (?, ?, ?, ?, 'STUDENT', ?, datetime('now'))
      `).bind(email, phone, hashedPassword, name, academyId).run();
      
      userId = result.meta.last_row_id;
      insertSuccess = true;
      logs.push(`✅ 패턴 1 성공! userId: ${userId}`);
    } catch (e: any) {
      logs.push(`❌ 패턴 1 실패: ${e.message}`);
      
      // 패턴 2: snake_case 시도
      try {
        logs.push('🔄 시도 2: snake_case (academy_id, created_at)');
        const result = await DB.prepare(`
          INSERT INTO users (email, phone, password, name, role, academy_id, created_at)
          VALUES (?, ?, ?, ?, 'STUDENT', ?, datetime('now'))
        `).bind(email, phone, hashedPassword, name, academyId).run();
        
        userId = result.meta.last_row_id;
        insertSuccess = true;
        logs.push(`✅ 패턴 2 성공! userId: ${userId}`);
      } catch (e2: any) {
        logs.push(`❌ 패턴 2 실패: ${e2.message}`);
        
        // 패턴 3: 최소 필드만
        try {
          logs.push('🔄 시도 3: 최소 필드 (email, password, name, role만)');
          const result = await DB.prepare(`
            INSERT INTO users (email, password, name, role)
            VALUES (?, ?, ?, 'STUDENT')
          `).bind(email, hashedPassword, name).run();
          
          userId = result.meta.last_row_id;
          insertSuccess = true;
          logs.push(`✅ 패턴 3 성공! userId: ${userId}`);
        } catch (e3: any) {
          logs.push(`❌ 패턴 3 실패: ${e3.message}`);
        }
      }
    }

    if (!insertSuccess || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '모든 INSERT 패턴 실패',
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

    // 6. 결과 조회
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    logs.push(`✅ 생성된 user: ${JSON.stringify(user)}`);

    const student = await DB.prepare('SELECT * FROM students WHERE userId = ? OR user_id = ?').bind(userId, userId).first();
    logs.push(`✅ 생성된 student: ${JSON.stringify(student)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '학생 추가 성공!',
        userId,
        studentInsertSuccess,
        user,
        student,
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
