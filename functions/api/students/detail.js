// Cloudflare Pages Function
// GET /api/students/detail?id=<student_id>
// 학생 상세 정보 조회 (RBAC 적용)

import { getUserFromAuth } from '../../_lib/auth';

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const studentId = url.searchParams.get('id');

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "학생 ID가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 인증 확인
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      console.error('❌ Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const role = userPayload.role?.toUpperCase();
    const requesterAcademyId = userPayload.academyId;

    console.log('👤 학생 상세 조회:', { studentId, role, requesterAcademyId });

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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "학생 정보를 찾을 수 없습니다" 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 권한 확인
    if (role === 'STUDENT') {
      if (userPayload.id !== student.id && userPayload.userId !== student.id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "본인 정보만 조회할 수 있습니다" 
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (role === 'TEACHER' || role === 'DIRECTOR') {
      const studentAcademyId = student.academyId ? String(student.academyId) : null;
      const requesterAcademyIdStr = requesterAcademyId ? String(requesterAcademyId) : null;
      
      if (studentAcademyId !== requesterAcademyIdStr) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "같은 학원 학생만 조회할 수 있습니다" 
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

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

    // 응답
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
        createdAt: student.createdAt
      }
    };

    console.log('✅ 학생 상세 정보 조회 완료');
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ 학생 상세 조회 에러:', error);
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
