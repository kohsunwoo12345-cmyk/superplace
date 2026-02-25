// 학생 상세 정보 조회 API
// GET /api/student/get?id=<student_id>

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
      
      if (tokenAge > maxAge) {
        throw new Error('Token expired');
      }
      
      return {
        userId,
        id: userId,
        email,
        role,
        academyId: academyId || null,
        timestamp: tokenTime,
      };
    }
    
    if (parts.length === 4) {
      const [userId, email, role, timestamp] = parts;
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const tokenAge = now - tokenTime;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (tokenAge > maxAge) {
        throw new Error('Token expired');
      }
      
      return {
        userId,
        id: userId,
        email,
        role,
        academyId: null,
        timestamp: tokenTime,
      };
    }
    
    throw new Error('Invalid token format');
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

function getUserFromAuth(request) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error('No Authorization header or invalid format');
    return null;
  }
  
  const token = authHeader.substring(7);
  return decodeToken(token);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return Response.json({ 
      success: false, 
      error: "Database not configured" 
    }, { status: 500 });
  }

  try {
    // 인증 확인
    const userPayload = getUserFromAuth(request);
    
    if (!userPayload) {
      return Response.json({ 
        success: false, 
        error: "인증이 필요합니다" 
      }, { status: 401 });
    }

    // Query parameter에서 ID 추출
    const url = new URL(request.url);
    const studentId = url.searchParams.get('id');
    
    if (!studentId) {
      return Response.json({ 
        success: false, 
        error: "학생 ID가 필요합니다" 
      }, { status: 400 });
    }

    const requesterRole = userPayload.role?.toUpperCase();
    const requesterAcademyId = userPayload.academyId;
    
    console.log('👨‍🎓 학생 상세 조회:', { 
      studentId, 
      requesterRole, 
      requesterAcademyId,
      requesterId: userPayload.id || userPayload.userId
    });

    // 학생 정보 조회 - by-academy.js와 동일한 쿼리 사용
    let student = null;
    let foundInTable = null;
    
    // 먼저 User 테이블 (by-academy와 동일)
    try {
      const userQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.academyId,
          u.role,
          u.school,
          u.grade,
          u.createdAt
        FROM User u
        WHERE u.id = ? AND u.role = 'STUDENT'
      `;
      
      const userResult = await DB.prepare(userQuery).bind(studentId).first();
      
      if (userResult) {
        console.log('✅ User 테이블에서 학생 조회 성공');
        student = userResult;
        foundInTable = 'User';
      } else {
        console.log('⚠️ User 테이블에 해당 학생 없음');
      }
    } catch (e) {
      console.log('⚠️ User 테이블 조회 실패:', e.message);
    }

    // users 테이블 시도 (fallback) - by-academy와 동일
    if (!student) {
      try {
        const usersQuery = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            CAST(u.academy_id AS TEXT) as academyId,
            u.role,
            u.school,
            u.grade,
            u.createdAt
          FROM users u
          WHERE u.id = ? AND u.role = 'STUDENT'
        `;
        
        const usersResult = await DB.prepare(usersQuery).bind(studentId).first();
        
        if (usersResult) {
          console.log('✅ users 테이블에서 학생 조회 성공');
          student = usersResult;
          foundInTable = 'users';
        } else {
          console.log('⚠️ users 테이블에 해당 학생 없음');
        }
      } catch (e) {
        console.log('⚠️ users 테이블 조회 실패:', e.message);
      }
    }

    if (!student) {
      console.log('❌ 학생을 찾을 수 없음:', studentId, '- 두 테이블 모두 조회했으나 없음');
      return Response.json({ 
        success: false, 
        error: "학생 정보를 찾을 수 없습니다",
        debug: {
          studentId,
          searchedTables: ['User', 'users']
        }
      }, { status: 404 });
    }

    console.log('📋 조회된 학생 정보:', { 
      id: student.id, 
      name: student.name, 
      academyId: student.academyId,
      academyIdType: typeof student.academyId,
      foundInTable
    });

    // 권한 확인
    if (requesterRole === 'STUDENT') {
      // 학생 본인만 조회 가능
      if (userPayload.id !== student.id && userPayload.userId !== student.id) {
        console.log('❌ 권한 없음: 본인이 아님');
        return Response.json({ 
          success: false, 
          error: "본인 정보만 조회할 수 있습니다" 
        }, { status: 403 });
      }
    } else if (requesterRole === 'TEACHER' || requesterRole === 'DIRECTOR') {
      // 선생님/원장은 같은 학원 학생만 조회 가능
      const studentAcademyId = student.academyId ? String(student.academyId) : null;
      const requesterAcademyIdStr = requesterAcademyId ? String(requesterAcademyId) : null;
      
      console.log('🔍 학원 비교:', { 
        studentAcademyId, 
        requesterAcademyIdStr,
        match: studentAcademyId === requesterAcademyIdStr
      });
      
      if (studentAcademyId !== requesterAcademyIdStr) {
        console.log('❌ 권한 없음: 다른 학원');
        return Response.json({ 
          success: false, 
          error: "같은 학원 학생만 조회할 수 있습니다" 
        }, { status: 403 });
      }
    }
    // SUPER_ADMIN, ADMIN은 모든 학생 조회 가능

    // Academy 정보 조회
    if (student.academyId) {
      try {
        const academy = await DB.prepare(`
          SELECT name, code, address, phone
          FROM Academy
          WHERE id = ?
        `).bind(student.academyId).first();
        
        if (academy) {
          student.academy_name = academy.name;
          student.academy_code = academy.code;
          student.academy_address = academy.address;
          student.academy_phone = academy.phone;
        }
      } catch (e) {
        console.log('⚠️ Academy 조회 실패:', e.message);
      }
    }

    // 학생이 속한 반 조회
    let classes = [];
    try {
      const classesResult = await DB.prepare(`
        SELECT c.id, c.name, c.grade, c.subject
        FROM Class c
        INNER JOIN ClassStudent cs ON c.id = cs.classId
        WHERE cs.studentId = ?
      `).bind(studentId).all();
      
      classes = classesResult.results || [];
    } catch (e) {
      console.log('⚠️ 반 정보 조회 실패:', e.message);
    }

    // 응답 데이터 구성
    const response = {
      success: true,
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        phone: student.phone,
        school: student.school,
        grade: student.grade,
        academyId: student.academyId,
        academyName: student.academy_name,
        academyCode: student.academy_code,
        academyAddress: student.academy_address,
        academyPhone: student.academy_phone,
        classes: classes,
        createdAt: student.createdAt
      }
    };

    console.log('✅ 학생 상세 정보 조회 완료');
    return Response.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ 학생 상세 조회 에러:', error);
    return Response.json({ 
      success: false, 
      error: "서버 오류가 발생했습니다",
      message: error.message 
    }, { status: 500 });
  }
}
