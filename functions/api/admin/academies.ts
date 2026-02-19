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

    // 모든 테이블 목록 먼저 확인
    let allTables = [];
    try {
      const tablesResult = await env.DB.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
      `).all();
      allTables = (tablesResult.results || []).map(t => t.name);
      console.log('📋 All tables in database:', allTables);
    } catch (error) {
      console.error('❌ Failed to list tables:', error);
    }

    // Academy 테이블명 찾기
    let academyTable = null;
    const possibleAcademyNames = ['Academy', 'academies', 'ACADEMY', 'academy', 'Academies'];
    for (const name of possibleAcademyNames) {
      if (allTables.includes(name)) {
        academyTable = name;
        break;
      }
    }
    
    if (!academyTable) {
      // 부분 매칭 시도
      academyTable = allTables.find(t => t.toLowerCase().includes('academy'));
    }
    
    if (!academyTable) {
      console.error('❌ No Academy table found. Available tables:', allTables);
      return new Response(JSON.stringify({
        success: true,
        academies: [],
        total: 0,
        error: 'Academy table not found',
        message: `학원 테이블을 찾을 수 없습니다. 사용 가능한 테이블: ${allTables.join(', ')}`,
        availableTables: allTables
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // User 테이블명 찾기
    let userTable = null;
    const possibleUserNames = ['User', 'users', 'USER', 'user', 'Users'];
    for (const name of possibleUserNames) {
      if (allTables.includes(name)) {
        userTable = name;
        break;
      }
    }
    
    if (!userTable) {
      // 부분 매칭 시도
      userTable = allTables.find(t => t.toLowerCase().includes('user'));
    }
    
    if (!userTable) {
      console.error('❌ No User table found. Available tables:', allTables);
      return new Response(JSON.stringify({
        success: true,
        academies: [],
        total: 0,
        error: 'User table not found',
        message: `사용자 테이블을 찾을 수 없습니다. 사용 가능한 테이블: ${allTables.join(', ')}`,
        availableTables: allTables
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log('✅ Using table names:', { academyTable, userTable });

    // 테이블 스키마 확인
    try {
      const academySchema = await env.DB.prepare(`
        SELECT name FROM pragma_table_info('${academyTable}')
      `).all();
      const academyColumns = (academySchema.results || []).map(c => c.name);
      console.log('📋 Academy columns:', academyColumns);
      
      const userSchema = await env.DB.prepare(`
        SELECT name FROM pragma_table_info('${userTable}')
      `).all();
      const userColumns = (userSchema.results || []).map(c => c.name);
      console.log('📋 User columns:', userColumns);
    } catch (error) {
      console.warn('⚠️ Schema check failed:', error);
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
