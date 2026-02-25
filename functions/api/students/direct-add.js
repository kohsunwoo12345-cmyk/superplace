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
        tokenAcademyId = parts[3] || academyId;
        logs.push(`✅ 토큰에서 academyId 추출: ${tokenAcademyId}`);
      }
    }

    // 임시 이메일 생성 (전화번호 기반)
    const tempEmail = `student_${phone}@temp.superplace.local`;
    logs.push(`✅ 임시 이메일 생성: ${tempEmail}`);

    // 임시 비밀번호 생성 및 해싱 (전화번호 뒷자리)
    const tempPasswordPlain = phone.slice(-6);
    logs.push(`✅ 임시 비밀번호 생성: ${tempPasswordPlain}`);
    
    // 비밀번호 해싱
    const salt = 'superplace-salt-2024';
    const encoder = new TextEncoder();
    const data = encoder.encode(tempPasswordPlain + salt);
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
      await DB.prepare(`
        INSERT INTO User (id, email, name, password, phone, role, academyId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'STUDENT', ?, datetime('now'), datetime('now'))
      `).bind(studentId, tempEmail, name, hashedPassword, phone, tokenAcademyId).run();
      
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

    // 생성된 학생 정보 조회
    const createdStudent = await DB.prepare('SELECT id, name, email, phone, role, academyId FROM User WHERE id = ?').bind(studentId).first();
    logs.push(`✅ 생성된 학생 조회 성공`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '학생 추가 성공!',
        user: createdStudent,
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
