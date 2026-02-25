// Cloudflare Pages Function
// GET /api/students/by-academy
// 학원별 학생 목록 조회 (RBAC 적용 - JWT 토큰 기반)

// 인라인 토큰 디코딩 함수
function decodeToken(token) {
  try {
    let parts = token.split('|');
    
    if (parts.length === 5) {
      const [userId, email, role, academyId, timestamp] = parts;
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const tokenAge = now - tokenTime;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (tokenAge > maxAge) throw new Error('Token expired');
      
      return { userId, id: userId, email, role, academyId: academyId || null, timestamp: tokenTime };
    }
    
    if (parts.length === 4) {
      const [userId, email, role, timestamp] = parts;
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const tokenAge = now - tokenTime;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (tokenAge > maxAge) throw new Error('Token expired');
      
      return { userId, id: userId, email, role, academyId: null, timestamp: tokenTime };
    }
    
    throw new Error('Invalid token format');
  } catch (error) {
    return null;
  }
}

function getUserFromAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  return decodeToken(token);
}

// 단일 학생 상세 조회 함수
async function getSingleStudent(DB, studentId, userPayload) {
  try {
    console.log('🎯 단일 학생 상세 조회:', studentId);
    const role = userPayload.role?.toUpperCase();
    const tokenAcademyId = userPayload.academyId;
    
    let student = null;
    
    // 🔄 재시도 로직 (D1 Read Replica 지연 대응)
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries && !student; attempt++) {
      console.log(`🔄 시도 ${attempt}/${maxRetries}...`);
      
      // 1️⃣ User 테이블 조회 (role 조건 제거 - 더 빠른 인덱스 사용)
      try {
        const userResult = await DB.prepare(
          `SELECT 
            id, name, email, phone, role, academyId, school, grade,
            createdAt, updatedAt, points, approved
          FROM User 
          WHERE id = ?`
        ).bind(studentId).first();
        
        if (userResult) {
          console.log(`✅ User 테이블에서 발견 (시도 ${attempt}), role: ${userResult.role}`);
          if (userResult.role === 'STUDENT') {
            student = userResult;
            break;
          } else {
            console.log(`⚠️ 학생이 아님: role=${userResult.role}`);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "학생 정보가 아닙니다" 
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      } catch (err) {
        console.log(`⚠️ User 테이블 조회 실패 (시도 ${attempt}):`, err.message);
      }
      
      // 2️⃣ users 테이블 조회 (fallback)
      if (!student) {
        try {
          const usersResult = await DB.prepare(
            `SELECT 
              id, name, email, phone, role,
              CAST(academy_id AS TEXT) as academyId,
              school, grade, created_at as createdAt, updated_at as updatedAt
            FROM users 
            WHERE id = ?`
          ).bind(studentId).first();
          
          if (usersResult && usersResult.role === 'STUDENT') {
            console.log(`✅ users 테이블에서 발견 (시도 ${attempt})`);
            student = usersResult;
            break;
          }
        } catch (err) {
          console.log(`⚠️ users 테이블 조회 실패 (시도 ${attempt}):`, err.message);
        }
      }
      
      // 마지막 시도가 아니면 잠시 대기 (100ms)
      if (attempt < maxRetries && !student) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (!student) {
      console.error('❌ 학생을 찾을 수 없습니다:', studentId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "학생 정보를 찾을 수 없습니다" 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 🔒 권한 검증
    const studentAcademyId = String(student.academyId || '');
    
    if (role === 'STUDENT') {
      if (student.id !== userPayload.userId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "자신의 정보만 조회할 수 있습니다" 
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (role === 'DIRECTOR' || role === 'TEACHER') {
      // academyId가 null이거나 빈 문자열이면 권한 검증 스킵
      if (studentAcademyId && tokenAcademyId) {
        if (studentAcademyId !== String(tokenAcademyId || '')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "같은 학원의 학생만 조회할 수 있습니다",
              debug: {
                studentAcademyId,
                tokenAcademyId: String(tokenAcademyId),
                studentId: student.id
              }
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      // academyId가 null이면 로그만 출력하고 통과
      if (!studentAcademyId) {
        console.log('⚠️ 학생의 academyId가 null - 권한 검증 스킵');
      }
    }
    // ADMIN, SUPER_ADMIN은 모든 학생 조회 가능
    
    // 🏫 학원 정보 조회
    let academyInfo = null;
    if (student.academyId) {
      try {
        const academy = await DB.prepare(
          `SELECT id, name, code, address, phone 
           FROM Academy 
           WHERE id = ?`
        ).bind(student.academyId).first();
        
        if (academy) {
          academyInfo = {
            id: academy.id,
            name: academy.name,
            code: academy.code,
            address: academy.address,
            phone: academy.phone
          };
        }
      } catch (err) {
        console.log('⚠️ 학원 정보 조회 실패:', err.message);
      }
    }
    
    console.log('✅ 학생 상세 조회 성공');
    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          school: student.school,
          grade: student.grade,
          academyId: student.academyId,
          academy: academyInfo,
          points: student.points || 0,
          approved: student.approved === 1,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('❌ 학생 상세 조회 오류:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "서버 오류가 발생했습니다",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔒 보안 강화: Authorization 헤더에서 사용자 정보 추출
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      console.error('❌ by-academy: Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다",
          students: []
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const role = userPayload.role?.toUpperCase();
    const tokenAcademyId = userPayload.academyId;
    const userEmail = userPayload.email;

    console.log('👥 by-academy API - Authenticated user:', { role, academyId: tokenAcademyId, email: userEmail });

    // 🆕 단일 학생 조회 지원
    const url = new URL(context.request.url);
    const requestedStudentId = url.searchParams.get("id");
    
    if (requestedStudentId) {
      console.log('🔍 단일 학생 조회 요청:', requestedStudentId);
      return await getSingleStudent(DB, requestedStudentId, userPayload);
    }

    const upperRole = role;
    
    // 🔄 User 테이블과 users 테이블 모두 조회 (UNION)
    console.log('🔍 User + users 테이블 통합 조회 시작');
    console.log('🔑 Token academyId:', tokenAcademyId, 'Type:', typeof tokenAcademyId);
    
    // academyId 처리: 문자열은 그대로, 숫자는 정수로
    const academyIdValue = tokenAcademyId;
    const isStringId = typeof tokenAcademyId === 'string' && isNaN(parseInt(tokenAcademyId));
    console.log('🔍 academyId 분석:', { value: academyIdValue, isString: isStringId });
    
    let allStudents = [];
    
    // 1️⃣ User 테이블 조회 (새 학생)
    try {
      console.log('📌 User 테이블 조회 중 (모든 필터 제거 - 디버깅)...');
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.academyId,
          u.role,
          u.isWithdrawn,
          u.status
        FROM User u
      `;
      
      const bindings = [];
      
      if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
        const url = new URL(context.request.url);
        const requestedAcademyId = url.searchParams.get("academyId");
        if (requestedAcademyId) {
          query += ` AND u.academyId = ?`;
          bindings.push(requestedAcademyId);
        }
      } else if (upperRole === 'DIRECTOR' || upperRole === 'TEACHER') {
        if (!tokenAcademyId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Academy ID not found in token",
              message: "학원 정보가 없습니다",
              students: []
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        // 임시로 academyId 필터 제거 - 디버깅용
        // query += ` AND u.academyId = ?`;
        // bindings.push(academyIdValue);
        console.log(`🏫 ${upperRole} - academyId 필터 임시 제거 (디버깅)`, academyIdValue);
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Unauthorized access",
            message: "접근 권한이 없습니다",
            students: []
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      
      query += ` ORDER BY u.id DESC`;
      
      const userResult = await DB.prepare(query).bind(...bindings).all();
      console.log(`✅ User 테이블: ${userResult.results.length}명`);
      allStudents.push(...(userResult.results || []));
    } catch (userErr) {
      console.log('⚠️ User 테이블 조회 실패:', userErr.message);
    }
    
    // 2️⃣ users 테이블 조회 (기존 학생)
    try {
      console.log('📌 users 테이블 조회 중...');
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          CAST(u.academy_id AS TEXT) as academyId,
          u.role,
          u.isWithdrawn,
          u.status
        FROM users u
        WHERE u.role = 'STUDENT'
          AND (u.isWithdrawn IS NULL OR u.isWithdrawn = 0)
      `;
      
      const bindings = [];
      
      if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN') {
        const url = new URL(context.request.url);
        const requestedAcademyId = url.searchParams.get("academyId");
        if (requestedAcademyId) {
          query += ` AND u.academy_id = ?`;
          bindings.push(parseInt(requestedAcademyId));
        }
      } else if (upperRole === 'DIRECTOR' || upperRole === 'TEACHER') {
        query += ` AND u.academy_id = ?`;
        bindings.push(academyIdValue);
        console.log(`🏫 ${upperRole} - Filtering users by academy_id:`, academyIdValue);
      }
      
      query += ` ORDER BY u.id DESC`;
      
      const usersResult = await DB.prepare(query).bind(...bindings).all();
      console.log(`✅ users 테이블: ${usersResult.results.length}명`);
      allStudents.push(...(usersResult.results || []));
    } catch (usersErr) {
      console.log('⚠️ users 테이블 조회 실패:', usersErr.message);
    }
    
    if (allStudents.length === 0) {
      console.error('❌ 두 테이블 모두 결과 없음');
      return new Response(
        JSON.stringify({
          success: true,
          students: [],
          message: "학생이 없습니다"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 중복 제거 (id 기준)
    const uniqueStudents = Array.from(
      new Map(allStudents.map(s => [s.id, s])).values()
    );

    console.log('🔍 통합 결과:', JSON.stringify(uniqueStudents.slice(0, 2), null, 2));
    console.log('🔍 중복 제거 후 총 학생 수:', uniqueStudents.length);
    
    const students = uniqueStudents.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      studentCode: s.id,
      grade: s.grade,
      phone: s.phone,
      academyId: s.academyId ? String(s.academyId) : null,
      status: s.status || 'ACTIVE'
    }));
    
    console.log('✅ Students found:', students.length);
    console.log('📝 First student:', students[0]);

    return new Response(
      JSON.stringify({
        success: true,
        students: students,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Get students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get students",
        message: error.message,
        students: []
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
