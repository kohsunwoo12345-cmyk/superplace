// Cloudflare Pages Function
// GET /api/students/[id]
// 학생 상세 조회 (동적 라우팅)

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
    
    // 1️⃣ User 테이블 조회
    try {
      const userResult = await DB.prepare(
        `SELECT 
          id, name, email, phone, role, academyId, school, grade,
          createdAt, updatedAt, points, approved
        FROM User 
        WHERE id = ?`
      ).bind(studentId).first();
      
      if (userResult && userResult.role === 'STUDENT') {
        console.log('✅ User 테이블에서 발견');
        student = userResult;
      }
    } catch (err) {
      console.log('⚠️ User 테이블 조회 실패:', err.message);
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
          console.log('✅ users 테이블에서 발견');
          student = usersResult;
        }
      } catch (err) {
        console.log('⚠️ users 테이블 조회 실패:', err.message);
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
      if (studentAcademyId !== String(tokenAcademyId || '')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "같은 학원의 학생만 조회할 수 있습니다" 
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
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
      console.error('❌ [id]: Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 동적 라우팅 파라미터에서 studentId 추출
    const studentId = context.params.id;
    
    if (!studentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Student ID is required" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 학생 상세 조회 (동적 라우팅):', studentId);
    return await getSingleStudent(DB, studentId, userPayload);
  } catch (error) {
    console.error("❌ Student detail error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get student details",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
