// Cloudflare Pages Function
// GET /api/admin/academies - 모든 학원 및 학원장 목록 조회 (동적 컬럼 감지)

import { getUserFromAuth } from '../../_lib/auth';

// 컬럼명 매핑 함수
function getColumnName(columns, possibleNames) {
  for (const name of possibleNames) {
    if (columns.includes(name)) {
      return name;
    }
  }
  return null;
}

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

    // 1. 모든 테이블 목록 확인
    const tablesResult = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all();
    const allTables = (tablesResult.results || []).map(t => t.name);
    console.log('📋 All tables:', allTables);

    // 2. Academy 테이블명 찾기
    const possibleAcademyNames = ['Academy', 'academies', 'ACADEMY', 'academy', 'Academies'];
    let academyTable = null;
    for (const name of possibleAcademyNames) {
      if (allTables.includes(name)) {
        academyTable = name;
        break;
      }
    }
    if (!academyTable) {
      academyTable = allTables.find(t => t.toLowerCase().includes('academy'));
    }
    
    if (!academyTable) {
      console.error('❌ No Academy table found');
      return new Response(JSON.stringify({
        success: true,
        academies: [],
        total: 0,
        error: 'Academy table not found',
        message: `학원 테이블을 찾을 수 없습니다. 테이블: ${allTables.join(', ')}`,
        availableTables: allTables
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. User 테이블명 찾기
    const possibleUserNames = ['User', 'users', 'USER', 'user', 'Users'];
    let userTable = null;
    for (const name of possibleUserNames) {
      if (allTables.includes(name)) {
        userTable = name;
        break;
      }
    }
    if (!userTable) {
      userTable = allTables.find(t => t.toLowerCase().includes('user'));
    }
    
    if (!userTable) {
      console.error('❌ No User table found');
      return new Response(JSON.stringify({
        success: true,
        academies: [],
        total: 0,
        error: 'User table not found',
        message: `사용자 테이블을 찾을 수 없습니다. 테이블: ${allTables.join(', ')}`,
        availableTables: allTables
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log('✅ Using tables:', { academyTable, userTable });

    // 4. Academy 테이블 스키마 확인
    const academySchemaResult = await env.DB.prepare(`
      SELECT name FROM pragma_table_info('${academyTable}')
    `).all();
    const academyColumns = (academySchemaResult.results || []).map(c => c.name);
    console.log('📋 Academy columns:', academyColumns);

    // 5. User 테이블 스키마 확인
    const userSchemaResult = await env.DB.prepare(`
      SELECT name FROM pragma_table_info('${userTable}')
    `).all();
    const userColumns = (userSchemaResult.results || []).map(c => c.name);
    console.log('📋 User columns:', userColumns);

    // 6. 컬럼명 동적 매핑
    const nameCol = getColumnName(academyColumns, ['name', 'academy_name', 'academyName', 'NAME', 'ACADEMY_NAME']);
    const activeCol = getColumnName(academyColumns, ['isActive', 'is_active', 'active', 'ISACTIVE', 'IS_ACTIVE']);
    const createdCol = getColumnName(academyColumns, ['createdAt', 'created_at', 'createdat', 'CREATEDAT', 'CREATED_AT']);
    const directorIdCol = getColumnName(academyColumns, ['directorId', 'director_id', 'DIRECTORID', 'DIRECTOR_ID']);
    const academyIdCol = getColumnName(userColumns, ['academyId', 'academy_id', 'ACADEMYID', 'ACADEMY_ID']);
    
    console.log('🔍 Detected columns:', {
      name: nameCol,
      isActive: activeCol,
      createdAt: createdCol,
      directorId: directorIdCol,
      academyId: academyIdCol
    });

    if (!nameCol) {
      console.error('❌ Cannot find name column in Academy table');
      return new Response(JSON.stringify({
        success: true,
        academies: [],
        total: 0,
        error: 'Name column not found',
        message: `학원 이름 컬럼을 찾을 수 없습니다. 컬럼: ${academyColumns.join(', ')}`,
        availableColumns: academyColumns
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. 동적 쿼리 생성
    const query = `
      SELECT 
        a.id,
        a.${nameCol} as name,
        a.address,
        a.phone,
        a.email,
        ${activeCol ? `a.${activeCol} as isActive,` : '1 as isActive,'}
        ${createdCol ? `a.${createdCol} as createdAt,` : 'NULL as createdAt,'}
        u.name as directorName,
        u.email as directorEmail,
        ${userColumns.includes('phone') ? 'u.phone' : userColumns.includes('phoneNumber') ? 'u.phoneNumber' : 'NULL'} as directorPhone,
        ${academyIdCol ? `(SELECT COUNT(*) FROM ${userTable} WHERE ${academyIdCol} = a.id AND role = 'STUDENT') as studentCount,` : '0 as studentCount,'}
        ${academyIdCol ? `(SELECT COUNT(*) FROM ${userTable} WHERE ${academyIdCol} = a.id AND role = 'TEACHER') as teacherCount,` : '0 as teacherCount,'}
        ${academyIdCol ? `(SELECT COUNT(*) FROM ${userTable} WHERE ${academyIdCol} = a.id AND role = 'DIRECTOR') as directorCount` : '0 as directorCount'}
      FROM ${academyTable} a
      LEFT JOIN ${userTable} u ON ${directorIdCol ? `a.${directorIdCol} = u.id` : '1=0'}
      ${createdCol ? `ORDER BY a.${createdCol} DESC` : 'ORDER BY a.id DESC'}
    `;
    
    console.log('🔍 Executing query:', query);
    
    const academiesResult = await env.DB.prepare(query).all();
    console.log('✅ Query result count:', academiesResult.results?.length || 0);
    
    if (academiesResult.results && academiesResult.results.length > 0) {
      console.log('📋 First academy:', JSON.stringify(academiesResult.results[0], null, 2));
    }

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

    console.log('🎉 Success! Returning', academies.length, 'academies');

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
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    return new Response(JSON.stringify({
      success: true,
      academies: [],
      total: 0,
      error: error.message,
      errorStack: error.stack,
      message: "학원 목록을 불러오는 중 오류가 발생했습니다. D1 Console에서 테이블을 확인해주세요."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
