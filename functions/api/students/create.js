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
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '이름, 이메일, 비밀번호는 필수입니다',
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
        tokenAcademyId = parts[3] || academyId;
        logs.push(`✅ 토큰에서 academyId 추출: ${tokenAcademyId}`);
      }
    }

    logs.push(`✅ 사용할 이메일: ${email}`);

    // 비밀번호 해싱
    const salt = 'superplace-salt-2024';
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    logs.push(`✅ 비밀번호 해싱 완료`);

    // Student ID 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const studentId = `student-${timestamp}-${randomStr}`;
    logs.push(`✅ Student ID 생성: ${studentId}`);

    // User 테이블에 삽입
    try {
      logs.push('🔄 User 테이블에 삽입 시도...');
      
      // school 필드 처리 (있을 경우만 추가)
      let query = `
        INSERT INTO User (
          id, email, name, password, phone, parentPhone, 
          grade, class, role, academyId, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT', ?, datetime('now'), datetime('now'))
      `;
      
      const params = [
        studentId, 
        email, 
        name, 
        hashedPassword, 
        phone || null, 
        parentPhone || null,
        grade || null,
        studentClass || null,
        tokenAcademyId
      ];
      
      logs.push(`📝 SQL 파라미터: ${JSON.stringify(params)}`);
      
      await DB.prepare(query).bind(...params).run();
      
      logs.push(`✅ User 테이블 삽입 성공!`);
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
          email: email,
          name: name,
          phone: phone,
          parentPhone: parentPhone,
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
