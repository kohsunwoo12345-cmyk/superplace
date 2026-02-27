// POST /api/students/direct-add
// 직접 학생 추가 - 비밀번호 해싱 포함

export async function onRequestPost(context) {
  const logs = [];
  
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

    const { 
      name, 
      email, 
      password, 
      phone, 
      parentPhone, 
      school, 
      grade, 
      class: studentClass,
      academyId 
    } = body;

    // 필수 필드 검증
    if (!name || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '이름과 비밀번호는 필수입니다',
          logs 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Student ID 생성을 먼저 (timestamp 필요)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const studentId = `student-${timestamp}-${randomStr}`;
    logs.push(`✅ Student ID 생성: ${studentId}`);
    
    // 이메일이 없으면 임시 이메일 생성
    const finalEmail = email || `student_${timestamp}@temp.superplace.local`;
    logs.push(`✅ 사용할 이메일: ${finalEmail}`);

    // Authorization 헤더에서 사용자 정보 추출
    const authHeader = context.request.headers.get('Authorization');
    let tokenAcademyId = academyId;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const parts = token.split('|');
      if (parts.length >= 4) {
        tokenAcademyId = parts[3] || academyId;
        logs.push(`✅ 토큰에서 academyId 추출: ${tokenAcademyId}`);
      }
    }

    // 비밀번호 해싱
    const salt = 'superplace-salt-2024';
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    logs.push(`✅ 비밀번호 해싱 완료`);

    // User 테이블에 삽입
    try {
      logs.push('🔄 User 테이블에 삽입 시도...');
      
      // 먼저 school 컬럼 포함해서 시도
      let query = `
        INSERT INTO User (
          id, email, name, password, phone, parentPhone, 
          school, grade, class, role, academyId, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT', ?, datetime('now'), datetime('now'))
      `;
      
      const params = [
        studentId, 
        finalEmail, 
        name, 
        hashedPassword, 
        phone || null, 
        parentPhone || null,
        school || null,
        grade || null,
        studentClass || null,
        tokenAcademyId
      ];
      
      logs.push(`📝 SQL 파라미터: ${JSON.stringify(params)}`);
      
      try {
        await DB.prepare(query).bind(...params).run();
        logs.push(`✅ User 테이블 삽입 성공! (school 포함)`);
      } catch (schoolError) {
        // school 컬럼이 없으면 school 제외하고 재시도
        if (schoolError.message.includes('no column named school')) {
          logs.push(`⚠️ school 컬럼 없음, school 제외하고 재시도...`);
          
          query = `
            INSERT INTO User (
              id, email, name, password, phone, parentPhone, 
              grade, class, role, academyId, createdAt, updatedAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT', ?, datetime('now'), datetime('now'))
          `;
          
          const paramsWithoutSchool = [
            studentId, 
            finalEmail, 
            name, 
            hashedPassword, 
            phone || null, 
            parentPhone || null,
            grade || null,
            studentClass || null,
            tokenAcademyId
          ];
          
          await DB.prepare(query).bind(...paramsWithoutSchool).run();
          logs.push(`✅ User 테이블 삽입 성공! (school 제외)`);
        } else {
          throw schoolError;
        }
      }
      
    } catch (e) {
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

    // INSERT한 데이터를 직접 반환 (SELECT 제거 - D1 replica lag 회피)
    logs.push(`✅ 학생 생성 완료 - ID: ${studentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '학생 추가 성공!',
        user: {
          id: studentId,
          email: finalEmail,
          name: name,
          phone: phone,
          parentPhone: parentPhone,
          school: school,
          grade: grade,
          class: studentClass,
          role: 'STUDENT',
          academyId: tokenAcademyId
        },
        userId: studentId,
        logs
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    logs.push(`❌ 전체 에러: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        logs
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
