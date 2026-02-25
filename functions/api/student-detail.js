// Cloudflare Pages Function
// GET /api/student-detail?id=<student_id>
// 학생 단일 상세 조회 (RBAC 적용 - JWT 토큰 기반)

import { getUserFromAuth } from './_lib/auth';

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

    // 🔒 보안 강화: Authorization 헤더에서 사용자 정보 추출
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      console.error('❌ student-detail: Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const upperRole = userPayload.role?.toUpperCase() || '';
    const tokenAcademyId = userPayload.academyId;
    const academyIdValue = tokenAcademyId ? String(tokenAcademyId) : null;
    
    console.log('👤 학생 상세 조회:', { studentId, role: upperRole, academyId: academyIdValue });

    let student = null;

    // User 테이블 조회
    try {
      const userQuery = `
        SELECT 
          u.id, u.name, u.email, u.phone, u.academyId, u.role, u.school, u.grade, u.createdAt
        FROM User u
        WHERE u.id = ? AND u.role = 'STUDENT'
      `;
      
      const userResult = await DB.prepare(userQuery).bind(studentId).first();
      
      if (userResult) {
        console.log('✅ User 테이블에서 조회 성공');
        student = userResult;
      }
    } catch (e) {
      console.log('⚠️ User 테이블 조회 실패:', e.message);
    }

    // users 테이블 조회 (fallback)
    if (!student) {
      try {
        const usersQuery = `
          SELECT 
            u.id, u.name, u.email, u.phone, 
            CAST(u.academy_id AS TEXT) as academyId,
            u.role, u.school, u.grade, u.createdAt
          FROM users u
          WHERE u.id = ? AND u.role = 'STUDENT'
        `;
        
        const usersResult = await DB.prepare(usersQuery).bind(studentId).first();
        
        if (usersResult) {
          console.log('✅ users 테이블에서 조회 성공');
          student = usersResult;
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
    if (upperRole === 'TEACHER' || upperRole === 'DIRECTOR') {
      const studentAcademyId = student.academyId ? String(student.academyId) : null;
      
      if (studentAcademyId !== academyIdValue) {
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
          student.academyName = academy.name;
          student.academyCode = academy.code;
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

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          email: student.email,
          name: student.name,
          phone: student.phone,
          school: student.school,
          grade: student.grade,
          academyId: student.academyId,
          academyName: student.academyName,
          academyCode: student.academyCode,
          classes: classes,
          createdAt: student.createdAt
        }
      }),
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
