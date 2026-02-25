// Cloudflare Pages Function
// GET /api/students/by-academy
// 학원별 학생 목록 조회 (RBAC 적용 - JWT 토큰 기반)

import { getUserFromAuth } from '../../_lib/auth';

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
      console.log('📌 User 테이블 조회 중...');
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.academyId,
          u.role
        FROM User u
        WHERE u.role = 'STUDENT'
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
        query += ` AND u.academyId = ?`;
        bindings.push(academyIdValue);
        console.log(`🏫 ${upperRole} - Filtering User by academyId:`, academyIdValue);
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
          u.role
        FROM users u
        WHERE u.role = 'STUDENT'
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
