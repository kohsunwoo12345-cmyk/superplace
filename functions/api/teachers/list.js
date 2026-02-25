// Teacher List API - JavaScript version
// GET /api/teachers/list
// Last updated: 2026-02-25 12:30:00

// Simple token parser
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Auth header invalid format');
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  console.log('🔍 Token parts count:', parts.length);
  
  if (parts.length < 3) {
    console.error('❌ Token has less than 3 parts');
    return null;
  }
  
  const parsed = {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null,
    timestamp: parts[4] || null
  };
  
  console.log('✅ Token parsed:', { id: parsed.id, email: parsed.email, role: parsed.role, academyId: parsed.academyId });
  
  return parsed;
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('=== Teacher list API called ===');

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token and verify auth
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: '인증이 필요합니다'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('인증됨:', { role: tokenData.role, academyId: tokenData.academyId });

    // Use token's role and academyId directly (avoid replica lag issues)
    const role = tokenData.role ? tokenData.role.toUpperCase() : '';
    const userAcademyId = tokenData.academyId;

    // Check permissions
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Permission check passed');
    console.log('🔍 Using academyId from token:', userAcademyId);

    const allTeachers = [];

    // Query User table for teachers
    // CRITICAL: Use batch() to force consistency and avoid replica lag
    try {
      let query = `
        SELECT 
          id, 
          email, 
          name, 
          phone, 
          role, 
          academyId, 
          approved,
          isWithdrawn,
          permissions,
          assignedClasses,
          createdAt,
          updatedAt
        FROM User 
        WHERE role = 'TEACHER' 
          AND (isWithdrawn IS NULL OR isWithdrawn = 0)
      `;

      const bindings = [];

      // Filter by academy for DIRECTOR
      if (role === 'DIRECTOR' && userAcademyId) {
        query += ' AND academyId = ?';
        bindings.push(userAcademyId);
        console.log('🔍 DIRECTOR mode: filtering by academyId =', userAcademyId);
      } else {
        console.log('🔍 ADMIN mode: no academyId filter');
      }

      query += ' ORDER BY createdAt DESC';

      console.log('🔍 Final Query:', query);
      console.log('📊 Bindings:', JSON.stringify(bindings));

      // Execute query with IMMEDIATE consistency
      // Force read from PRIMARY to avoid replica lag
      const stmt = db.prepare(query);
      const boundStmt = bindings.length > 0 ? stmt.bind(...bindings) : stmt;
      
      // Use batch() with single query to force primary DB read
      const batchResults = await db.batch([boundStmt]);
      const result = batchResults[0];
      
      console.log(`✅ User 테이블 쿼리 실행 완료`);
      console.log(`📊 조회된 교사 수: ${result.results ? result.results.length : 0}`);
      
      if (result.results && result.results.length > 0) {
        console.log('📋 첫 번째 교사:', JSON.stringify(result.results[0]));
        allTeachers.push(...result.results);
      } else {
        console.warn('⚠️ User 테이블에서 교사가 조회되지 않음');
      }
    } catch (e) {
      console.error('❌ User 테이블 조회 실패:', e.message);
      console.error('❌ Error stack:', e.stack);
    }

    // Also check users table (legacy)
    try {
      let query = `
        SELECT 
          id, 
          email, 
          name, 
          phone, 
          role, 
          academy_id as academyId,
          created_at as createdAt
        FROM users 
        WHERE role = 'TEACHER'
      `;

      const bindings = [];

      // Filter by academy for DIRECTOR
      if (role === 'DIRECTOR' && userAcademyId) {
        query += ' AND academy_id = ?';
        bindings.push(userAcademyId);
      }

      query += ' ORDER BY created_at DESC';

      // Use batch() to force primary DB read (consistency)
      const stmt = db.prepare(query);
      const boundStmt = bindings.length > 0 ? stmt.bind(...bindings) : stmt;
      const batchResults = await db.batch([boundStmt]);
      const result = batchResults[0];
      
      console.log(`✅ users 테이블에서 ${result.results.length}명의 교사 조회`);
      
      // Add default values for users table results
      const usersTableResults = result.results.map(teacher => ({
        ...teacher,
        approved: teacher.approved !== undefined ? teacher.approved : 1,
        isWithdrawn: teacher.isWithdrawn !== undefined ? teacher.isWithdrawn : 0,
        updatedAt: teacher.updatedAt || teacher.createdAt
      }));
      
      allTeachers.push(...usersTableResults);
    } catch (e) {
      console.error('❌ users 테이블 조회 실패:', e.message);
    }

    console.log(`📊 총 교사 수: ${allTeachers.length}명`);

    // Add counts and safely parse JSON fields
    const teachersWithCounts = allTeachers.map(teacher => {
      let permissions = [];
      let assignedClasses = [];
      
      // Safely parse permissions
      if (teacher.permissions) {
        try {
          if (typeof teacher.permissions === 'string') {
            permissions = JSON.parse(teacher.permissions);
          } else if (Array.isArray(teacher.permissions)) {
            permissions = teacher.permissions;
          }
        } catch (e) {
          console.error('❌ Failed to parse permissions:', e.message);
        }
      }
      
      // Safely parse assignedClasses
      if (teacher.assignedClasses) {
        try {
          if (typeof teacher.assignedClasses === 'string') {
            assignedClasses = JSON.parse(teacher.assignedClasses);
          } else if (Array.isArray(teacher.assignedClasses)) {
            assignedClasses = teacher.assignedClasses;
          }
        } catch (e) {
          console.error('❌ Failed to parse assignedClasses:', e.message);
        }
      }
      
      return {
        ...teacher,
        permissions,
        assignedClasses,
        _count: {
          createdMaterials: 0,
          createdAssignments: 0
        }
      };
    });

    return new Response(JSON.stringify({
      success: true,
      teachers: teachersWithCounts,
      total: teachersWithCounts.length,
      debug: {
        role: tokenData.role,
        academyId: tokenData.academyId,
        email: tokenData.email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Teacher list error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
