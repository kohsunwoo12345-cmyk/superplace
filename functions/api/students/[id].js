// 학생 상세 정보 조회 API
// GET /api/students/[id]

import { getUserFromAuth } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  const { request, env, params } = context;
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

    const studentId = params.id;
    const requesterRole = userPayload.role?.toUpperCase();
    const requesterAcademyId = userPayload.academyId;
    
    console.log('👨‍🎓 학생 상세 조회:', { 
      studentId, 
      requesterRole, 
      requesterAcademyId,
      requesterId: userPayload.id || userPayload.userId
    });

    // 학생 정보 조회 (User 테이블 우선)
    let student = null;
    
    try {
      student = await DB.prepare(`
        SELECT 
          id, email, name, phone, role, academyId, 
          school, grade, createdAt
        FROM User
        WHERE id = ? AND role = 'STUDENT'
      `).bind(studentId).first();
      
      if (student) {
        console.log('✅ User 테이블에서 학생 조회 성공');
      }
    } catch (e) {
      console.log('⚠️ User 테이블 조회 실패:', e.message);
    }

    // users 테이블 시도 (fallback)
    if (!student) {
      try {
        student = await DB.prepare(`
          SELECT 
            id, email, name, phone, role, 
            CAST(academyId AS TEXT) as academyId,
            school, grade, createdAt
          FROM users
          WHERE id = ? AND role = 'STUDENT'
        `).bind(studentId).first();
        
        if (student) {
          console.log('✅ users 테이블에서 학생 조회 성공');
        }
      } catch (e) {
        console.log('⚠️ users 테이블 조회 실패:', e.message);
      }
    }

    if (!student) {
      console.log('❌ 학생을 찾을 수 없음:', studentId);
      return Response.json({ 
        success: false, 
        error: "학생 정보를 찾을 수 없습니다" 
      }, { status: 404 });
    }

    console.log('📋 조회된 학생 정보:', { 
      id: student.id, 
      name: student.name, 
      academyId: student.academyId,
      academyIdType: typeof student.academyId
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
