// Cloudflare Pages Function
// GET /api/admin/academies - 실제 등록된 학원장의 학원 목록 조회
// GET /api/admin/academies?id=X - 특정 학원 상세 정보 조회

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

    // URL 파라미터 확인 - 개별 학원 조회 여부
    const url = new URL(request.url);
    const academyId = url.searchParams.get('id');

    console.log('📊 Fetching academies for user:', user.userId || user.id);
    if (academyId) {
      console.log('🔍 Requesting specific academy:', academyId);
    }

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

    // 개별 학원 상세 조회
    if (academyId) {
      console.log('🔍 Fetching specific academy details for ID:', academyId);
      
      // 학원장 정보 조회
      const directorQuery = `
        SELECT 
          ${idCol} as id,
          ${nameCol} as name,
          ${emailCol} as email,
          ${phoneCol} as phone,
          ${academyIdCol} as academy_id,
          ${createdAtCol} as created_at,
          ${roleCol} as role
        FROM ${userTable}
        WHERE ${roleCol} = ? AND ${academyIdCol} = ?
        LIMIT 1
      `;
      
      const director = await env.DB.prepare(directorQuery)
        .bind('DIRECTOR', academyId)
        .first();

      if (!director) {
        console.warn('⚠️ No director found for academy:', academyId);
        return new Response(JSON.stringify({
          success: false,
          error: 'Academy not found',
          message: '해당 학원을 찾을 수 없습니다.'
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log('✅ Found director:', director);

      // 학생 목록 조회 (User + users 테이블 통합)
      console.log('📚 Fetching students for academy:', academyId);
      
      let allStudents = [];
      
      // 1️⃣ User 테이블 조회 (신규 학생)
      if (allTables.includes('User')) {
        try {
          const userStudentsQuery = `
            SELECT 
              id,
              name,
              email,
              phone,
              created_at as createdAt
            FROM User
            WHERE academy_id = ? AND role = ?
            ORDER BY created_at DESC
          `;
          const userStudentsResult = await env.DB.prepare(userStudentsQuery)
            .bind(parseInt(academyId), 'STUDENT')
            .all();
          const userStudents = userStudentsResult.results || [];
          console.log(`  ✅ User 테이블: ${userStudents.length}명`);
          allStudents.push(...userStudents);
        } catch (err) {
          console.log('  ⚠️ User 테이블 조회 실패:', err.message);
        }
      }
      
      // 2️⃣ users 테이블 조회 (기존 학생)
      if (allTables.includes('users') && userTable === 'users') {
        try {
          const usersStudentsQuery = `
            SELECT 
              ${idCol} as id,
              ${nameCol} as name,
              ${emailCol} as email,
              ${phoneCol} as phone,
              ${createdAtCol} as createdAt
            FROM users
            WHERE ${academyIdCol} = ? AND ${roleCol} = ?
            ORDER BY ${createdAtCol} DESC
          `;
          const usersStudentsResult = await env.DB.prepare(usersStudentsQuery)
            .bind(parseInt(academyId), 'STUDENT')
            .all();
          const usersStudents = usersStudentsResult.results || [];
          console.log(`  ✅ users 테이블: ${usersStudents.length}명`);
          allStudents.push(...usersStudents);
        } catch (err) {
          console.log('  ⚠️ users 테이블 조회 실패:', err.message);
        }
      }
      
      // 중복 제거 (id 기준)
      const students = Array.from(
        new Map(allStudents.map(s => [s.id, s])).values()
      );
      
      console.log(`📊 총 학생 수: ${students.length}명 (User: ${allStudents.length - students.length}명 중복 제거)`);


      // 교사 목록 조회
      const teachersQuery = `
        SELECT 
          ${idCol} as id,
          ${nameCol} as name,
          ${emailCol} as email,
          ${phoneCol} as phone
        FROM ${userTable}
        WHERE ${academyIdCol} = ? AND ${roleCol} = ?
        ORDER BY ${nameCol}
      `;
      const teachersResult = await env.DB.prepare(teachersQuery)
        .bind(academyId, 'TEACHER')
        .all();
      const teachers = teachersResult.results || [];

      // Academy 테이블에서 추가 정보 조회 시도
      let academyInfo = null;
      let academyTable = null;
      
      if (allTables.includes('academies')) academyTable = 'academies';
      else if (allTables.includes('Academy')) academyTable = 'Academy';
      else if (allTables.includes('ACADEMY')) academyTable = 'ACADEMY';
      
      if (academyTable) {
        try {
          const academyQuery = `SELECT * FROM ${academyTable} WHERE id = ? LIMIT 1`;
          academyInfo = await env.DB.prepare(academyQuery)
            .bind(academyId)
            .first();
        } catch (err) {
          console.warn('  └─ Could not fetch academy info:', err.message);
        }
      }

      // 구독 정보 조회
      let subscriptionInfo = null;
      let planInfo = null;
      
      if (allTables.includes('user_subscriptions') && allTables.includes('pricing_plans')) {
        try {
          const subscriptionQuery = `
            SELECT 
              us.*,
              pp.name as plan_name,
              pp.maxStudents,
              pp.maxHomeworkChecks,
              pp.maxAIAnalysis,
              pp.maxSimilarProblems,
              pp.maxLandingPages
            FROM user_subscriptions us
            LEFT JOIN pricing_plans pp ON us.planId = pp.id
            WHERE us.academyId = ? AND us.isActive = 1
            ORDER BY us.createdAt DESC
            LIMIT 1
          `;
          subscriptionInfo = await env.DB.prepare(subscriptionQuery)
            .bind(academyId)
            .first();
          
          if (subscriptionInfo) {
            console.log('💳 Found active subscription:', subscriptionInfo.plan_name);
          } else {
            console.log('💳 No active subscription found');
          }
        } catch (err) {
          console.warn('  └─ Could not fetch subscription info:', err.message);
        }
      }

      // 학원 상세 정보 구성
      const academyDetail = {
        id: academyId,
        name: academyInfo?.name || academyInfo?.academy_name || `${director.name}의 학원`,
        code: academyInfo?.code || `${academyId}`,
        description: academyInfo?.description || '',
        address: academyInfo?.address || academyInfo?.academy_address || '',
        phone: academyInfo?.phone || academyInfo?.phone_number || director.phone || '',
        email: academyInfo?.email || academyInfo?.academy_email || director.email || '',
        logoUrl: academyInfo?.logo_url || academyInfo?.logoUrl || '',
        subscriptionPlan: subscriptionInfo?.plan_name || academyInfo?.subscription_plan || academyInfo?.subscriptionPlan || 'Free',
        currentPlan: subscriptionInfo ? {
          name: subscriptionInfo.plan_name || 'Free',
          maxStudents: subscriptionInfo.maxStudents || 0,
          maxHomeworkChecks: subscriptionInfo.maxHomeworkChecks || 0,
          maxAIAnalysis: subscriptionInfo.maxAIAnalysis || 0,
          maxSimilarProblems: subscriptionInfo.maxSimilarProblems || 0,
          maxLandingPages: subscriptionInfo.maxLandingPages || 0,
          usedStudents: subscriptionInfo.usedStudents || 0,
          usedHomeworkChecks: subscriptionInfo.usedHomeworkChecks || 0,
          usedAIAnalysis: subscriptionInfo.usedAIAnalysis || 0,
          usedSimilarProblems: subscriptionInfo.usedSimilarProblems || 0,
          usedLandingPages: subscriptionInfo.usedLandingPages || 0,
          startDate: subscriptionInfo.startDate || null,
          endDate: subscriptionInfo.endDate || null,
          isActive: subscriptionInfo.isActive === 1,
        } : null,
        maxStudents: subscriptionInfo?.maxStudents || academyInfo?.max_students || academyInfo?.maxStudents || 5,
        maxTeachers: academyInfo?.max_teachers || academyInfo?.maxTeachers || 10,
        isActive: academyInfo?.is_active !== false && academyInfo?.isActive !== false ? 1 : 0,
        createdAt: director.created_at || new Date().toISOString(),
        updatedAt: academyInfo?.updated_at || academyInfo?.updatedAt || new Date().toISOString(),
        director: {
          id: director.id,
          name: director.name,
          email: director.email,
          phone: director.phone || '',
        },
        students: students,
        teachers: teachers,
        studentCount: students.length,
        teacherCount: teachers.length,
        totalChats: 0, // TODO: AI 채팅 데이터 연동
        attendanceCount: 0, // TODO: 출석 데이터 연동
        homeworkCount: 0, // TODO: 숙제 데이터 연동
        monthlyActivity: [
          { month: "9월", count: 0 },
          { month: "10월", count: 0 },
          { month: "11월", count: 0 },
          { month: "12월", count: 0 },
          { month: "1월", count: 0 },
          { month: "2월", count: 0 },
        ],
        assignedBots: [], // TODO: AI 봇 데이터 연동
        payments: [], // TODO: 결제 데이터 연동
        revenue: {
          totalRevenue: 0,
          transactionCount: 0,
        },
      };

      console.log('🎉 Academy detail retrieved successfully');

      return new Response(JSON.stringify({
        success: true,
        academy: academyDetail,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 전체 학원 목록 조회 (기존 로직)
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

    // 각 학원장의 학원 정보 생성
    const academies = await Promise.all(directors.map(async (director) => {
      try {
        const directorAcademyId = director.academy_id;
        
        console.log(`📍 Processing director ${director.name} (ID: ${director.id}, Academy ID: ${directorAcademyId})`);

        // 해당 학원의 학생 수 조회 (User + users 테이블 통합)
        let totalStudentCount = 0;
        
        // User 테이블에서 학생 수
        if (allTables.includes('User')) {
          try {
            const userStudentsQuery = `
              SELECT COUNT(*) as count 
              FROM User 
              WHERE academy_id = ? AND role = ?
            `;
            const userStudentsResult = await env.DB.prepare(userStudentsQuery)
              .bind(parseInt(directorAcademyId), 'STUDENT')
              .first();
            totalStudentCount += (userStudentsResult?.count || 0);
            console.log(`  └─ User 테이블: ${userStudentsResult?.count || 0}명`);
          } catch (err) {
            console.log(`  └─ User 테이블 조회 오류:`, err.message);
          }
        }
        
        // users 테이블에서 학생 수
        try {
          const studentsQuery = `
            SELECT COUNT(*) as count 
            FROM ${userTable} 
            WHERE ${academyIdCol} = ? AND ${roleCol} = ?
          `;
          const studentsResult = await env.DB.prepare(studentsQuery)
            .bind(directorAcademyId, 'STUDENT')
            .first();
          totalStudentCount += (studentsResult?.count || 0);
          console.log(`  └─ ${userTable} 테이블: ${studentsResult?.count || 0}명`);
        } catch (err) {
          console.log(`  └─ ${userTable} 테이블 조회 오류:`, err.message);
        }
        
        const studentCount = totalStudentCount;

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

        // 구독 정보 조회
        let subscriptionInfo = null;
        if (allTables.includes('user_subscriptions') && allTables.includes('pricing_plans')) {
          try {
            const subscriptionQuery = `
              SELECT 
                us.*,
                pp.name as plan_name,
                pp.maxStudents,
                pp.maxHomeworkChecks,
                pp.maxAIAnalysis,
                pp.maxSimilarProblems,
                pp.maxLandingPages
              FROM user_subscriptions us
              LEFT JOIN pricing_plans pp ON us.planId = pp.id
              WHERE us.academyId = ? AND us.isActive = 1
              ORDER BY us.createdAt DESC
              LIMIT 1
            `;
            subscriptionInfo = await env.DB.prepare(subscriptionQuery)
              .bind(directorAcademyId)
              .first();
            
            if (subscriptionInfo) {
              console.log(`  └─ 💳 Subscription: ${subscriptionInfo.plan_name}`);
            }
          } catch (err) {
            console.log(`  └─ Could not fetch subscription:`, err.message);
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
          createdAt: director.created_at || new Date().toISOString(),
          // 구독 정보 추가
          subscriptionPlan: subscriptionInfo?.plan_name || 'Free',
          currentPlan: subscriptionInfo ? {
            name: subscriptionInfo.plan_name || 'Free',
            maxStudents: subscriptionInfo.maxStudents || 0,
            usedStudents: subscriptionInfo.usedStudents || 0,
            maxHomeworkChecks: subscriptionInfo.maxHomeworkChecks || 0,
            usedHomeworkChecks: subscriptionInfo.usedHomeworkChecks || 0,
            maxAIAnalysis: subscriptionInfo.maxAIAnalysis || 0,
            usedAIAnalysis: subscriptionInfo.usedAIAnalysis || 0,
            maxSimilarProblems: subscriptionInfo.maxSimilarProblems || 0,
            usedSimilarProblems: subscriptionInfo.usedSimilarProblems || 0,
            maxLandingPages: subscriptionInfo.maxLandingPages || 0,
            usedLandingPages: subscriptionInfo.usedLandingPages || 0,
            startDate: subscriptionInfo.startDate || null,
            endDate: subscriptionInfo.endDate || null,
            daysRemaining: subscriptionInfo.endDate ? 
              Math.ceil((new Date(subscriptionInfo.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
            isActive: subscriptionInfo.isActive === 1,
          } : {
            name: 'Free',
            maxStudents: 5,
            usedStudents: studentCount,
            maxHomeworkChecks: 10,
            usedHomeworkChecks: 0,
            maxAIAnalysis: 5,
            usedAIAnalysis: 0,
            maxSimilarProblems: 10,
            usedSimilarProblems: 0,
            maxLandingPages: 1,
            usedLandingPages: 0,
            startDate: null,
            endDate: null,
            daysRemaining: 999,
            isActive: true,
          }
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
