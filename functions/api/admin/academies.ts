// Cloudflare Pages Function
// GET /api/admin/academies - 실제 등록된 학원장의 학원 목록 조회

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

    // 1. 테이블명 확인
    const tablesResult = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all();
    const allTables = (tablesResult.results || []).map(t => t.name);
    console.log('📋 All tables:', allTables);

    // User 테이블명 찾기 (users, User, USER 모두 지원)
    let userTable = null;
    if (allTables.includes('users')) userTable = 'users';
    else if (allTables.includes('User')) userTable = 'User';
    else if (allTables.includes('USER')) userTable = 'USER';
    
    if (!userTable) {
      console.error('❌ User table not found in:', allTables);
      return new Response(JSON.stringify({
        success: true,
        academies: [],
        total: 0,
        error: 'User table not found',
        availableTables: allTables
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log('👥 Using User table:', userTable);

    // 2. User 테이블 스키마 확인
    const schemaResult = await env.DB.prepare(`
      PRAGMA table_info(${userTable})
    `).all();
    
    const columns = (schemaResult.results || []).map(col => col.name);
    console.log('📋 User table columns:', columns);

    // 컬럼명 매핑 (snake_case, camelCase, PascalCase 모두 지원)
    const idCol = columns.find(c => c === 'id') || 'id';
    const nameCol = columns.find(c => ['name', 'user_name', 'userName'].includes(c)) || 'name';
    const emailCol = columns.find(c => ['email', 'user_email', 'userEmail'].includes(c)) || 'email';
    const phoneCol = columns.find(c => ['phone', 'phoneNumber', 'phone_number'].includes(c)) || 'phone';
    const academyIdCol = columns.find(c => ['academy_id', 'academyId', 'ACADEMY_ID'].includes(c)) || 'academy_id';
    const roleCol = columns.find(c => ['role', 'user_role', 'userRole', 'ROLE'].includes(c)) || 'role';
    const createdAtCol = columns.find(c => ['created_at', 'createdAt', 'createdat', 'CREATED_AT'].includes(c)) || 'created_at';

    console.log('🔧 Column mapping:', {
      id: idCol,
      name: nameCol,
      email: emailCol,
      phone: phoneCol,
      academy_id: academyIdCol,
      role: roleCol,
      created_at: createdAtCol
    });

    // 3. 학원장(DIRECTOR) 목록 조회 - 동적 컬럼명 사용
    const directorsQuery = `
      SELECT 
        ${idCol} as id,
        ${nameCol} as name,
        ${emailCol} as email,
        ${phoneCol} as phone,
        ${academyIdCol} as academy_id,
        ${createdAtCol} as created_at,
        ${roleCol} as role
      FROM ${userTable}
      WHERE ${roleCol} = ?
      ORDER BY ${createdAtCol} DESC
    `;
    
    console.log('🔍 Executing directors query:', directorsQuery);
    const directorsResult = await env.DB.prepare(directorsQuery)
      .bind('DIRECTOR')
      .all();
    
    const directors = directorsResult.results || [];
    
    console.log('✅ Found directors:', directors.length);
    if (directors.length > 0) {
      console.log('📋 First director:', JSON.stringify(directors[0], null, 2));
    } else {
      console.warn('⚠️ No directors found! Checking all users...');
      
      // 모든 역할 확인
      const rolesQuery = `SELECT DISTINCT ${roleCol} as role FROM ${userTable}`;
      const rolesResult = await env.DB.prepare(rolesQuery).all();
      console.log('📋 Available roles:', rolesResult.results);
    }

    // 4. 각 학원장의 학원 정보 생성
    const academies = await Promise.all(directors.map(async (director) => {
      try {
        const directorAcademyId = director.academy_id;
        
        console.log(`📍 Processing director ${director.name} (ID: ${director.id}, Academy ID: ${directorAcademyId})`);

        // 해당 학원의 학생 수 조회
        const studentsQuery = `
          SELECT COUNT(*) as count 
          FROM ${userTable} 
          WHERE ${academyIdCol} = ? AND ${roleCol} = ?
        `;
        const studentsResult = await env.DB.prepare(studentsQuery)
          .bind(directorAcademyId, 'STUDENT')
          .first();
        const studentCount = studentsResult?.count || 0;

        // 해당 학원의 교사 수 조회
        const teachersQuery = `
          SELECT COUNT(*) as count 
          FROM ${userTable} 
          WHERE ${academyIdCol} = ? AND ${roleCol} = ?
        `;
        const teachersResult = await env.DB.prepare(teachersQuery)
          .bind(directorAcademyId, 'TEACHER')
          .first();
        const teacherCount = teachersResult?.count || 0;

        console.log(`  └─ ${director.name}: ${studentCount} 학생, ${teacherCount} 교사`);

        // Academy 테이블에서 학원 정보 조회 시도
        let academyInfo = null;
        let academyTable = null;
        
        if (allTables.includes('academies')) academyTable = 'academies';
        else if (allTables.includes('Academy')) academyTable = 'Academy';
        else if (allTables.includes('ACADEMY')) academyTable = 'ACADEMY';
        
        if (academyTable && directorAcademyId) {
          try {
            const academyQuery = `SELECT * FROM ${academyTable} WHERE id = ? LIMIT 1`;
            academyInfo = await env.DB.prepare(academyQuery)
              .bind(directorAcademyId)
              .first();
            
            if (academyInfo) {
              console.log(`  └─ Found academy info:`, academyInfo);
            }
          } catch (err) {
            console.warn(`  └─ Could not fetch academy info:`, err.message);
          }
        }

        // 학원 정보 구성
        const academyName = academyInfo?.name || academyInfo?.academy_name || `${director.name}의 학원`;
        const academyAddress = academyInfo?.address || academyInfo?.academy_address || '';
        const academyPhone = academyInfo?.phone || academyInfo?.phone_number || director.phone || '';
        const academyEmail = academyInfo?.email || academyInfo?.academy_email || director.email || '';

        return {
          id: directorAcademyId?.toString() || director.id?.toString(),
          name: academyName,
          address: academyAddress,
          phone: academyPhone,
          email: academyEmail,
          directorName: director.name,
          directorEmail: director.email,
          directorPhone: director.phone || '',
          studentCount: studentCount,
          teacherCount: teacherCount,
          directorCount: 1,
          isActive: academyInfo?.is_active !== false && academyInfo?.isActive !== false,
          createdAt: director.created_at || new Date().toISOString()
        };
      } catch (error) {
        console.error('❌ Error processing director:', director.id, error);
        return null;
      }
    }));

    // null 제거
    const validAcademies = academies.filter(a => a !== null);
    
    console.log('🎉 Success! Returning', validAcademies.length, 'academies');
    if (validAcademies.length > 0) {
      console.log('📋 First academy:', JSON.stringify(validAcademies[0], null, 2));
    }

    return new Response(JSON.stringify({
      success: true,
      academies: validAcademies,
      total: validAcademies.length,
      source: 'directors',
      message: validAcademies.length === 0 ? '등록된 학원장이 없습니다. https://superplacestudy.pages.dev/dashboard/admin/users/에서 학원장을 먼저 등록하세요.' : null
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error fetching academies:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    return new Response(JSON.stringify({
      success: true,
      academies: [],
      total: 0,
      error: error.message,
      errorDetails: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      },
      debugInfo: "학원장 데이터를 불러올 수 없습니다. Cloudflare Pages Logs를 확인하세요."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
