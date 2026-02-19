// Cloudflare Pages Function
// GET /api/admin/academies - 모든 학원 및 학원장 목록 조회

import { getUserFromAuth } from '../../_lib/auth';

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // 인증 확인
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Unauthorized" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = getUserFromAuth(request);
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid token" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('📊 Fetching academies for user:', user.userId || user.id);

    // 먼저 테이블명 확인 (Academy vs academies)
    let academyTable = 'Academy';
    let userTable = 'User';
    
    try {
      // Academy 테이블 존재 여부 확인
      const checkAcademy = await env.DB.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='Academy'
      `).first();
      
      if (!checkAcademy) {
        // 소문자 테이블명 시도
        const checkAcademies = await env.DB.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='academies'
        `).first();
        if (checkAcademies) {
          academyTable = 'academies';
        }
      }
      
      // User 테이블 존재 여부 확인
      const checkUser = await env.DB.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='User'
      `).first();
      
      if (!checkUser) {
        // 소문자 테이블명 시도
        const checkUsers = await env.DB.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='users'
        `).first();
        if (checkUsers) {
          userTable = 'users';
        }
      }
      
      console.log('📋 Using table names:', { academyTable, userTable });
    } catch (error) {
      console.warn('⚠️ Table check failed, using default names:', error);
    }

    // Academy 테이블에서 모든 학원 조회
    const query = `
      SELECT 
        a.id,
        a.name,
        a.address,
        a.phone,
        a.email,
        a.isActive,
        a.createdAt,
        u.name as directorName,
        u.email as directorEmail,
        u.phoneNumber as directorPhone,
        (SELECT COUNT(*) FROM ${userTable} WHERE academyId = a.id AND role = 'STUDENT') as studentCount,
        (SELECT COUNT(*) FROM ${userTable} WHERE academyId = a.id AND role = 'TEACHER') as teacherCount,
        (SELECT COUNT(*) FROM ${userTable} WHERE academyId = a.id AND role = 'DIRECTOR') as directorCount
      FROM ${academyTable} a
      LEFT JOIN ${userTable} u ON a.directorId = u.id
      ORDER BY a.createdAt DESC
    `;
    
    console.log('🔍 Executing query:', query);
    const academiesResult = await env.DB.prepare(query).all();

    console.log('✅ Found academies:', academiesResult.results?.length || 0);
    console.log('📋 Raw academy data:', JSON.stringify(academiesResult.results?.slice(0, 3), null, 2));

    const academies = (academiesResult.results || []).map(academy => ({
      id: academy.id,
      name: academy.name,
      address: academy.address || '',
      phone: academy.phone || '',
      email: academy.email || '',
      directorName: academy.directorName || '학원장 미지정',
      directorEmail: academy.directorEmail || '',
      directorPhone: academy.directorPhone || '',
      studentCount: academy.studentCount || 0,
      teacherCount: academy.teacherCount || 0,
      directorCount: academy.directorCount || 0,
      isActive: Boolean(academy.isActive),
      createdAt: academy.createdAt
    }));

    return new Response(JSON.stringify({
      success: true,
      academies: academies,
      total: academies.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error fetching academies:", error);
    console.error("❌ Error stack:", error.stack);
    
    // 에러가 발생해도 빈 배열 반환 (프론트엔드에서 "0개" 대신 에러 메시지 표시)
    return new Response(JSON.stringify({
      success: true,
      academies: [],
      total: 0,
      error: error.message,
      message: "학원 목록을 불러오는 중 오류가 발생했습니다. D1 Console에서 테이블을 확인해주세요."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
