// 학생 목록 조회 API - 완전 새로 작성

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null
  };
}

export async function onRequestGet(context) {
  const { DB } = context.env;
  
  console.log('=== by-academy API 시작 ===');
  
  // 인증 확인
  const authHeader = context.request.headers.get('Authorization');
  const tokenData = parseToken(authHeader);
  
  if (!tokenData) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: '인증이 필요합니다'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  console.log('인증됨:', { role: tokenData.role, academyId: tokenData.academyId });
  
  try {
    // URL 파라미터에서 id 확인 (단일 학생 조회)
    const url = new URL(context.request.url);
    const requestedId = url.searchParams.get('id');
    
    if (requestedId) {
      console.log('단일 학생 조회:', requestedId);
      
      // 단일 학생 조회
      let student = null;
      
      // User 테이블 조회
      try {
        student = await DB.prepare('SELECT * FROM User WHERE id = ?').bind(requestedId).first();
        if (student && student.role === 'STUDENT') {
          console.log('✅ 학생 발견:', student.name);
          return new Response(JSON.stringify({
            success: true,
            student: student,
            students: [student]
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        console.log('User 테이블 조회 실패:', e.message);
      }
      
      // users 테이블 조회 (fallback)
      try {
        student = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(requestedId).first();
        if (student && student.role === 'STUDENT') {
          console.log('✅ 학생 발견 (users):', student.name);
          return new Response(JSON.stringify({
            success: true,
            student: student,
            students: [student]
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        console.log('users 테이블 조회 실패:', e.message);
      }
      
      // 못찾음
      return new Response(JSON.stringify({
        success: false,
        error: '학생을 찾을 수 없습니다'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 전체 학생 목록 조회
    console.log('전체 학생 목록 조회');
    console.log('요청자 Role:', tokenData.role, 'Academy ID:', tokenData.academyId);
    
    const allStudents = [];
    
    // User 테이블 조회 (academyId 필터링 추가)
    try {
      let query = 'SELECT * FROM User WHERE role = ? AND (isWithdrawn IS NULL OR isWithdrawn = 0)';
      const bindings = ['STUDENT'];
      
      // DIRECTOR는 자기 학원 학생만 조회
      if (tokenData.role === 'DIRECTOR' && tokenData.academyId) {
        query += ' AND academyId = ?';
        bindings.push(tokenData.academyId);
        console.log('🏫 DIRECTOR 필터: academyId =', tokenData.academyId);
      }
      
      const result = await DB.prepare(query).bind(...bindings).all();
      console.log(`User 테이블: ${result.results.length}명 (퇴원 제외, academyId 필터 적용)`);
      
      allStudents.push(...result.results);
    } catch (e) {
      console.log('User 조회 실패:', e.message);
    }
    
    // users 테이블 조회 (academyId 필터링 추가)
    try {
      let query = 'SELECT * FROM users WHERE role = ? AND (isWithdrawn IS NULL OR isWithdrawn = 0)';
      const bindings = ['STUDENT'];
      
      // DIRECTOR는 자기 학원 학생만 조회
      if (tokenData.role === 'DIRECTOR' && tokenData.academyId) {
        query += ' AND academy_id = ?';
        bindings.push(tokenData.academyId);
        console.log('🏫 DIRECTOR 필터 (users): academy_id =', tokenData.academyId);
      }
      
      const result = await DB.prepare(query).bind(...bindings).all();
      console.log(`users 테이블: ${result.results.length}명 (퇴원 제외, academyId 필터 적용)`);
      
      allStudents.push(...result.results);
    } catch (e) {
      console.log('users 조회 실패:', e.message);
    }
    
    console.log(`총 학생 수: ${allStudents.length}명`);
    
    return new Response(JSON.stringify({
      success: true,
      students: allStudents,
      total: allStudents.length,
      debug: {
        role: tokenData.role,
        academyId: tokenData.academyId,
        email: tokenData.email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('에러:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
